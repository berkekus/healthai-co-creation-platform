import { Schema, model, Document, Types } from 'mongoose'

export interface ILog extends Document {
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
LogSchema.index({ createdAt: -1 })
LogSchema.index({ action: 1 })
LogSchema.index({ result: 1 })
// Güvenlik politikası (hesap silme e-postasındaki taahhüt): audit loglar 24 ay saklanır
LogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 30 * 24 * 60 * 60 })

export default model<ILog>('Log', LogSchema)
