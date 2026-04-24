import { Schema, model, Document, Types } from 'mongoose'

export interface ILog extends Document {
  timestamp: Date
  userId?: Types.ObjectId
  userEmail: string
  role: string
  action: string
  targetEntityId?: string
  result: 'success' | 'failure'
  ipAddress?: string
  createdAt: Date
  updatedAt: Date
}

const LogSchema = new Schema<ILog>(
  {
    timestamp: { type: Date, required: true, default: Date.now },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    userEmail: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, required: true },
    action: { type: String, required: true },
    targetEntityId: { type: String },
    result: { type: String, enum: ['success', 'failure'], required: true },
    ipAddress: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => { Reflect.deleteProperty(ret, '__v'); return ret },
    },
  }
)

LogSchema.index({ userId: 1 })
LogSchema.index({ timestamp: -1 })
LogSchema.index({ action: 1 })
LogSchema.index({ result: 1 })

export default model<ILog>('Log', LogSchema)
