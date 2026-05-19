import { Schema, model, Document, Types } from 'mongoose'

export interface ISavedSearch extends Document {
  userId: Types.ObjectId
  name: string
  filters: {
    domain?: string
    expertise?: string
    city?: string
    country?: string
    projectStage?: string
    authorRole?: string
    search?: string
  }
  createdAt: Date
  updatedAt: Date
}

const SavedSearchSchema = new Schema<ISavedSearch>(
  {
    userId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name:    { type: String, required: true, trim: true, maxlength: 80 },
    filters: {
      domain:       { type: String, trim: true },
      expertise:    { type: String, trim: true },
      city:         { type: String, trim: true },
      country:      { type: String, trim: true },
      projectStage: { type: String, trim: true },
      authorRole:   { type: String, trim: true },
      search:       { type: String, trim: true },
    },
  },
  { timestamps: true }
)

SavedSearchSchema.index({ userId: 1 })

export default model<ISavedSearch>('SavedSearch', SavedSearchSchema)
