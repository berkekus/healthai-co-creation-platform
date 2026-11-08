import { Schema, model, Document, Types } from 'mongoose'

/**
 * A profile photo, kept in the database because the host's disk is wiped on
 * every restart and deploy. The browser shrinks a photo to a small JPEG first,
 * so each one is tens of kilobytes.
 */
export interface IAvatar extends Document {
  userId: Types.ObjectId
  contentType: string
  data: Buffer
  createdAt: Date
}

const AvatarSchema = new Schema<IAvatar>(
  {
    userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    contentType: { type: String, required: true },
    data:        { type: Buffer, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

AvatarSchema.index({ userId: 1 })

export default model<IAvatar>('Avatar', AvatarSchema)
