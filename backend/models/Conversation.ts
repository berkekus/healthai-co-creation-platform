import { Schema, model, Document, Types } from 'mongoose'

export interface IParticipantDetail {
  userId: Types.ObjectId
  name: string
  role: string
}

export interface IConversation extends Document {
  meetingId: Types.ObjectId
  postId: Types.ObjectId
  postTitle: string
  participants: Types.ObjectId[]
  participantDetails: IParticipantDetail[]
  lastMessageAt: Date
  lastMessagePreview: string
  createdAt: Date
  updatedAt: Date
}

const ParticipantDetailSchema = new Schema<IParticipantDetail>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name:   { type: String, required: true },
    role:   { type: String, required: true },
  },
  { _id: false },
)

const ConversationSchema = new Schema<IConversation>(
  {
    meetingId:          { type: Schema.Types.ObjectId, ref: 'Meeting', required: true, unique: true },
    postId:             { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    postTitle:          { type: String, required: true, trim: true },
    participants:       [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    participantDetails: [ParticipantDetailSchema],
    lastMessageAt:      { type: Date, default: Date.now },
    lastMessagePreview: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => { Reflect.deleteProperty(ret, '__v'); return ret },
    },
  },
)

ConversationSchema.index({ participants: 1 })

export default model<IConversation>('Conversation', ConversationSchema)
