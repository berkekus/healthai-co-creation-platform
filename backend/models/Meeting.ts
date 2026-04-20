import { Schema, model, Document, Types } from 'mongoose'

export type MeetingStatus =
  | 'pending'
  | 'time_proposed'
  | 'confirmed'
  | 'declined'
  | 'cancelled'

export interface ITimeSlot {
  date: string
  time: string
}

export interface IMeeting extends Document {
  postId: Types.ObjectId
  postTitle: string
  requesterId: Types.ObjectId
  requesterName: string
  ownerId: Types.ObjectId
  ownerName: string
  status: MeetingStatus
  message: string
  ndaAccepted: boolean
  proposedSlots: ITimeSlot[]
  confirmedSlot?: ITimeSlot
  createdAt: Date
  updatedAt: Date
}

const TimeSlotSchema = new Schema<ITimeSlot>(
  {
    date: { type: String, required: true },
    time: { type: String, required: true },
  },
  { _id: false }
)

const MeetingSchema = new Schema<IMeeting>(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    postTitle: { type: String, required: true, trim: true },
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    requesterName: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ownerName: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'time_proposed', 'confirmed', 'declined', 'cancelled'],
      default: 'pending',
    },
    message: { type: String, required: true, trim: true },
    ndaAccepted: { type: Boolean, required: true },
    proposedSlots: { type: [TimeSlotSchema], required: true },
    confirmedSlot: { type: TimeSlotSchema },
  },
  { timestamps: true }
)

MeetingSchema.index({ postId: 1 })
MeetingSchema.index({ requesterId: 1 })
MeetingSchema.index({ ownerId: 1 })
MeetingSchema.index({ status: 1 })

export default model<IMeeting>('Meeting', MeetingSchema)
