import express from "express";
const multer = require("multer");

import * as models from '../../models';
import { Utils, s3 } from "../../utils";

const router = express.Router();

router.get('/all/incomplete', async ( req, res ) => {
  try {
    const { REVIEWS_API_KEY } = req.query;

    if ( Utils.AppConfig.BasicConfig.REVIEWS_API_KEY !== REVIEWS_API_KEY ) return res.status(400).send('Bad Request: Invalid input');

    // Compute dates
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const formattedTwoDaysAgo = twoDaysAgo.toISOString().split('T')[0] + ' ' + twoDaysAgo.toTimeString().split(' ')[0];

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const formattedTwoWeeksAgo = twoWeeksAgo.toISOString().split('T')[0] + ' ' + twoWeeksAgo.toTimeString().split(' ')[0];


    let incompleteReviews = await models.EventTicketCart.query(`
      select etc.id, etc.stripeTransactionId, etc.eventId, etc.email, e.title, e.banner from event_ticket_cart etc
      left join events e on e.id = etc.eventId
      where etc.reviewCompleted = FALSE and etc.completed = TRUE 
      and ( etc.lastReviewEmailSent < '${formattedTwoDaysAgo}' or etc.lastReviewEmailSent is null )
      and e.endEventDate >= '${formattedTwoWeeksAgo}';
    `)

    res.json(incompleteReviews)
  }catch(e){
    return res.status(504);
  }
});

router.post('/:reviewId/lastReviewSent', async ( req, res ) => {
  try {
    const { REVIEWS_API_KEY } = req.query;

    const { reviewId } = req.params;

    if ( Utils.AppConfig.BasicConfig.REVIEWS_API_KEY !== REVIEWS_API_KEY ) return res.status(400).send('Bad Request: Invalid input');

    let review = await models.EventTicketCart.findOne({ where: { id: reviewId } });

    if ( !review ) return res.status(404).send('Review not found');

    review.lastReviewEmailSent = new Date();
    await review.save();

    return res.status(200).send('Review updated');
  }catch(e){
    return res.status( 504 );
  }
})

router.post('/picture', async ( req: any, res: any ) => {
    const upload = multer().single("image");
  
    upload( req, res, async function ( err : any ) {
      if ( req.fileValidationError ) return res.send( req.fileValidationError );
  
      else if ( !req.file ) return res.json({ error: "Please select an image to upload"});
  
      else if ( err instanceof multer.MulterError ) return res.send( err );
  
      else if ( err ) return res.send( err );
  
      try {
        
        Utils.verifyRequestParams( req.body, [ "payment_intent" ]);
        
        const cart = await models.EventTicketCart.findOne({ where: { stripeTransactionId: req.body.payment_intent, completed: true }, relations: [ 'review' ] });
  
        if ( !cart ) return res.status( 500 ).json({ error: 'Could not find event ticket' });
  
        let url = await s3.uploadImage( req.file, req.file.mimetype, 'cart/review/picture');
  
        let review: models.EventTicketCartReview | null = null;
  
        if ( !cart.review ) {
          review = new models.EventTicketCartReview();
  
          review.photo = url;
  
          await review.save();
  
          cart.review = review;
        }else cart.review.photo = url;
  
        await cart.save();
  
        return res.status( 200 ).json({ message: 'success', url });
      }catch(e) {
        console.log( e );
  
        res.status(500).json({ error: 'Error uploading review picture' });
      }
    })
});

export default router;
