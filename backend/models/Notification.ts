import { Schema, model, Document, Types } from 'mongoose'

export type NotificationType =
  | 'meeting_request'
  | 'meeting_accepted'
  | 'meeting_declined'
  | 'meeting_cancelled'
  | 'post_closed'
  | 'partner_found'

export interface INotification extends Document {
  userId: Types.ObjectId
  type: NotificationType
  title: string
  body: string
  isRead: boolean
  linkTo?: string
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'meeting_request',
        'meeting_accepted',
        'meeting_declined',
        'meeting_cancelled',
        'post_closed',
        'partner_found',
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false },
    linkTo: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => { delete ret.__v; return ret },
    },
  }
)

NotificationSchema.index({ userId: 1, isRead: 1 })

export default model<INotification>('Notification', NotificationSchema)
