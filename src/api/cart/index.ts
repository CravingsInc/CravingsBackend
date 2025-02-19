import express from "express";
const multer = require("multer");

import * as models from '../../models';
import { s3, Utils } from "../../utils";

import ReviewRouter from './review';

const router = express.Router();

router.get('/QrCode', async ( req: any, res: any ) => {
    const upload = multer().single("image");
  
    upload( req, res, async function( err: any ) {
      if ( req.fileValidationError ) return res.send( req.fileValidationError );
  
      else if (!req.file) return res.json({ error: "Please select an image to upload" });
  
      else if (err instanceof multer.MulterError) return res.send(err);
  
      else if (err) return res.send(err);
  
      try {
        
        Utils.verifyRequestParams( req.body, [ "payment_intent" ]);

        const cart = await models.EventTicketCart.findOne({ where: { stripeTransactionId: req.body.payment_intent } });
  
        if ( !cart ) return res.status(500).json({ error: 'Could not find Cart', param: req.body });
  
        if ( cart.qrCode.length === 0 && !cart.completed ) {
          let url = await s3.uploadImage(req.file, req.file.mimetype, 'cart/qrCode')
  
          cart.qrCode = url;
          await cart.save();
        }
  
        return res.status(200).json({ message: 'success' });
      }catch(e) {
        console.log(e);
  
        res.status(500).json({ error: 'Error uploading qrCode' });
      }
  
    })
});

router.use('/review', ReviewRouter);

export default router;