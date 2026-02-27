import type { Request, Response } from "express";
import type { AuthService } from "../services/auth.service";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
};

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  signup = async (req: Request, res: Response): Promise<void> => {
    const { email, name, password, orgName } = req.body as {
      email: string;
      name: string;
      password: string;
      orgName: string;
    };

    const result = await this.authService.signup({ email, name, password, orgName });

    res.cookie("session", result.token, {
      ...COOKIE_OPTIONS,
      maxAge: this.authService.cookieMaxAge,
    });

    res.status(201).json({
      user: result.user,
      organization: result.organization,
    });
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body as { email: string; password: string };

    const result = await this.authService.login({ email, password });

    res.cookie("session", result.token, {
      ...COOKIE_OPTIONS,
      maxAge: this.authService.cookieMaxAge,
    });

    res.json({
      user: result.user,
      organization: result.organization,
    });
  };

  logout = (_req: Request, res: Response): void => {
    res.clearCookie("session");
    res.json({ message: "Logged out" });
  };

  me = (req: Request, res: Response): void => {
    res.json({
      user: req.auth.user
        ? {
            id: req.auth.user.id,
            email: req.auth.user.email,
            name: req.auth.user.name,
          }
        : null,
      organization: {
        id: req.auth.organization.id,
        name: req.auth.organization.name,
        plan: req.auth.organization.plan,
      },
    });
  };
}
