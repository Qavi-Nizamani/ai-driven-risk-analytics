import { Schema, model, type Document } from "mongoose";

export interface ProjectDocument extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<ProjectDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

export const ProjectModel = model<ProjectDocument>("Project", projectSchema);

