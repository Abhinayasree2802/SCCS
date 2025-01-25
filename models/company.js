const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//const Review = require('./review');
//const GoogleUser = require('./googleuser');

const opt = { toJSON: { virtuals: true } };

const ImageSchema = new Schema(
  {
    url: String,
    filename: String
  }
)

ImageSchema.virtual('thumbnail').get(function () { // we name virtual as 'thumbnail'
  return this.url.replace('/upload', '/upload/w_210,h_200');  // modifies the url i.e. replace the '/upload' with 'upload/w_200'
})

const companySchema = new Schema({
  
  name: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  images: [ImageSchema],
//   reviews: [
//     {
//       type: Schema.Types.ObjectId,
//       ref: 'Review'
//     }
//   ],
//   owner: {
//     type: Schema.Types.ObjectId,
//     ref: 'GoogleUser',
//     required: true
//   },

  items: [String]

}, opt);


// // DELETING THE REVIEWS AFTER A COMPANY IS DELETED
// companySchema.post('findOneAndDelete', async (doc) => {
//   if (doc) {
//     await Review.deleteMany({
//       _id: { $in: doc.reviews }
//     })
//   }
// })


module.exports = mongoose.model('Company', companySchema);
