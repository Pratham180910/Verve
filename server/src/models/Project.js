import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    deadline: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'],
      default: 'PLANNING',
    },
  },
  {
    timestamps: true,
  }
);

const Project = mongoose.model('Project', projectSchema);
export default Project;
