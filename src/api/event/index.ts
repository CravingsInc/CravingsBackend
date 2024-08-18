import express from "express";
const multer = require("multer");

import * as models from '../../models';
import { Utils, s3 } from "../../utils";

const router = express.Router();

router.post('/upload/banner', ( req: any, res: any ) => {
    const upload = multer().single("image");
  
    upload( req, res, async function ( err: any ) {
      if ( req.fileValidationError ) return res.send(req.fileValidationError);
  
      else if ( !req.file ) return res.json({ error: "Please select an image to upload" });
  
      else if ( err ) return res.send(err);
  
      try {
        let organizer: models.Organizers;
        let event: models.Events | null;
  
        organizer = await Utils.getOrganizerFromJsWebToken(req.body.token);
        event = await models.Events.findOne({ where: { id: req.body.eventId, organizer: { id: organizer.id } } });
  
        if ( !event ) return res.json({ error: "Event not found" });
  
        let url = await s3.uploadImage(req.file, req.file.mimetype, "events/banner");
        event.banner = url;
        await event.save();
  
        return res.json({ response: url });
      }catch( err ) {
        res.json({ error: "Problem changing event banner" });
      }
    
    })
});
  
router.post('/upload/gallery', ( req: any, res: any ) => {
    const upload = multer().single("image");
  
    upload( req, res, async function ( err: any ) {
      if ( req.fileValidationError ) return res.send( req.fileValidationError );
  
      else if ( !req.file ) return res.json({ error: "Please select an image to upload" });
  
      else if ( err ) return res.send( err );
  
      try {
        let organizer: models.Organizers;
        let event: models.Events | null;
  
        organizer = await Utils.getOrganizerFromJsWebToken( req.body.token );
        event = await models.Events.findOne({ where: { id: req.body.eventId, organizer: { id: organizer.id }} });
  
        if ( !event ) return res.json({ error: "Event not found" });
  
        let url = await s3.uploadImage( req.file, req.file.mimetype, "events/gallery" );
      
        let photo = await models.EventPhotos.create({
          picture: url,
          event: { id: event.id }
        }).save()
  
        return res.json({ url, photoId: photo.id });
      }catch( err ) {
        console.log( err );
        res.json({ error: "Problem uploading new photo gallery for event" });
      }
    })
});

export default router;
