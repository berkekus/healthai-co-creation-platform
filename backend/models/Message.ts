import { Schema, model, Document, Types } from 'mongoose'

export interface IMessage extends Document {
  conversationId: Types.ObjectId
  senderId: Types.ObjectId
  senderName: string
  content: string
  readBy: Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    senderId:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderName:     { type: String, required: true, trim: true },
    content:        { type: String, required: true, trim: true, maxlength: 4000 },
    readBy:         [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => { Reflect.deleteProperty(ret, '__v'); return ret },
    },
  },
)

MessageSchema.index({ conversationId: 1, createdAt: 1 })

export default model<IMessage>('Message', MessageSchema)
