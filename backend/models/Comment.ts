import { Schema, model, Document, Types } from 'mongoose'

export interface IComment extends Document {
  postId: Types.ObjectId
  authorId: Types.ObjectId
  authorName: string
  authorRole: string
  content: string
  parentId?: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const CommentSchema = new Schema<IComment>(
  {
    postId:     { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    authorId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true, trim: true },
    authorRole: { type: String, required: true },
    content:    { type: String, required: true, trim: true, maxlength: 500 },
    parentId:   { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => { Reflect.deleteProperty(ret, '__v'); return ret },
    },
  },
)

CommentSchema.index({ postId: 1, createdAt: 1 })

export default model<IComment>('Comment', CommentSchema)
