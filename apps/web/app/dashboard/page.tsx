'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import type { Customer } from "@risk-engine/types";
import { io, type Socket } from "socket.io-client";

interface RiskUpdatedPayload {
  customerId: string;
  riskScore: number;
  riskLevel: string;
}

type CustomerRow = Customer;

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function getWebsocketUrl(): string {
  return process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4001";
}

export default function DashboardPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [installmentAmount, setInstallmentAmount] = useState<string>("");
  const [installmentDueDate, setInstallmentDueDate] = useState<string>("");
  const [lastInstallmentId, setLastInstallmentId] = useState<string>("");
  const [targetInstallmentId, setTargetInstallmentId] = useState<string>("");

  const socketRef = useRef<Socket | null>(null);
  const [subscribed, setSubscribed] = useState<boolean>(false);

  const apiBaseUrl = useMemo(getApiBaseUrl, []);
  const websocketUrl = useMemo(getWebsocketUrl, []);

  useEffect(() => {
    async function loadCustomers() {
      try {
        setLoading(true);
        const response = await fetch(`${apiBaseUrl}/customers`);
        if (!response.ok) {
          throw new Error(`Failed to load customers: ${response.status}`);
        }
        const data = (await response.json()) as CustomerRow[];
        setCustomers(data);
        if (data.length > 0 && !selectedCustomerId) {
          setSelectedCustomerId(data[0].id);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void loadCustomers();
  }, [apiBaseUrl, selectedCustomerId]);

  useEffect(() => {
    const socket = io(websocketUrl);
    socketRef.current = socket;

    socket.on("connect", () => {
      // no-op; subscription handled in separate effect
    });

    socket.on("risk_updated", (payload: RiskUpdatedPayload) => {
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === payload.customerId
            ? {
                ...customer,
                riskScore: payload.riskScore,
                riskLevel: payload.riskLevel as Customer["riskLevel"]
              }
            : customer
        )
      );
    });

    socket.on("disconnect", () => {
      setSubscribed(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [websocketUrl]);

  useEffect(() => {
    if (!socketRef.current || subscribed || customers.length === 0) {
      return;
    }

    customers.forEach((customer) => {
      socketRef.current?.emit("subscribe_to_customer", { customerId: customer.id });
    });

    setSubscribed(true);
  }, [customers, subscribed]);

  async function handleCreateCustomer(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCustomerName,
          phone: newCustomerPhone
        })
      });

      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message ?? "Failed to create customer");
      }

      const created = (await response.json()) as CustomerRow;
      setCustomers((prev) => [...prev, created]);
      setNewCustomerName("");
      setNewCustomerPhone("");
      if (!selectedCustomerId) {
        setSelectedCustomerId(created.id);
      }

      socketRef.current?.emit("subscribe_to_customer", { customerId: created.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    }
  }

  async function handleCreateInstallment(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      if (!selectedCustomerId) {
        throw new Error("Please select a customer");
      }

      const amount = Number(installmentAmount);
      if (Number.isNaN(amount) || amount < 0) {
        throw new Error("Amount must be a non-negative number");
      }

      const response = await fetch(`${apiBaseUrl}/installments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          amount,
          dueDate: installmentDueDate
        })
      });

      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message ?? "Failed to create installment");
      }

      const created = (await response.json()) as {
        id: string;
      };

      setLastInstallmentId(created.id);
      setTargetInstallmentId(created.id);
      setInstallmentAmount("");
      setInstallmentDueDate("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    }
  }

  async function handleMarkInstallment(path: "pay" | "late", event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      if (!targetInstallmentId) {
        throw new Error("Please provide an installment ID");
      }

      const response = await fetch(
        `${apiBaseUrl}/installments/${encodeURIComponent(targetInstallmentId)}/${path}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" }
        }
      );

      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message ?? `Failed to mark installment as ${path}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    }
  }

  return (
    <main>
      <h1>Customer Risk Dashboard</h1>

      {loading && <p>Loading customers...</p>}
      {error && (
        <p style={{ color: "red" }}>
          Error: {error}
        </p>
      )}

      <section>
        <h2>Customers</h2>
        {customers.length === 0 ? (
          <p>No customers yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Risk Score</th>
                <th>Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.riskScore.toFixed(1)}</td>
                  <td>{customer.riskLevel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>Create Customer</h2>
        <form onSubmit={handleCreateCustomer}>
          <label>
            Name
            <input
              type="text"
              value={newCustomerName}
              onChange={(event) => setNewCustomerName(event.target.value)}
              required
            />
          </label>
          <label>
            Phone
            <input
              type="text"
              value={newCustomerPhone}
              onChange={(event) => setNewCustomerPhone(event.target.value)}
              required
            />
          </label>
          <button type="submit">Create Customer</button>
        </form>
      </section>

      <section>
        <h2>Create Installment</h2>
        <form onSubmit={handleCreateInstallment}>
          <label>
            Customer
            <select
              value={selectedCustomerId}
              onChange={(event) => setSelectedCustomerId(event.target.value)}
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Amount
            <input
              type="number"
              min="0"
              step="0.01"
              value={installmentAmount}
              onChange={(event) => setInstallmentAmount(event.target.value)}
              required
            />
          </label>
          <label>
            Due date
            <input
              type="date"
              value={installmentDueDate}
              onChange={(event) => setInstallmentDueDate(event.target.value)}
              required
            />
          </label>
          <button type="submit">Create Installment</button>
        </form>
        {lastInstallmentId && (
          <p>
            Last created installment ID: <code>{lastInstallmentId}</code>
          </p>
        )}
      </section>

      <section>
        <h2>Update Installment Status</h2>
        <form onSubmit={(event) => handleMarkInstallment("pay", event)}>
          <label>
            Installment ID
            <input
              type="text"
              value={targetInstallmentId}
              onChange={(event) => setTargetInstallmentId(event.target.value)}
              required
            />
          </label>
          <button type="submit">Mark as PAID</button>
        </form>
        <form onSubmit={(event) => handleMarkInstallment("late", event)}>
          <label>
            Installment ID
            <input
              type="text"
              value={targetInstallmentId}
              onChange={(event) => setTargetInstallmentId(event.target.value)}
              required
            />
          </label>
          <button type="submit">Mark as LATE</button>
        </form>
      </section>
    </main>
  );
}

