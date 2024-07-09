import express from "express";
const multer = require("multer");

import * as models from '../../models';
import { Utils, s3 } from "../../utils";

const router = express.Router();

router.post("/upload/image", (req: any, res: any) => {
    const upload = multer().single("image");
    upload(req, res, async function (err: any) {
      if (req.fileValidationError) return res.send(req.fileValidationError);
  
      else if (!req.file) return res.json({ error: "Please select an image to upload" });
  
      else if (err instanceof multer.MulterError) return res.send(err);
  
      else if (err) return res.send(err);
  
      try {
        let user: models.Users | models.Organizers | undefined = undefined;
  
        if ( req.body.craving === 'events' ) {
          user = ( await Utils.getUserFromJsWebToken(req.body.token) );
        }else {
          user = ( await Utils.getOrganizerFromJsWebToken(req.body.token) );
        }
  
        let url = await s3.uploadImage(req.file, req.file.mimetype);
        user.profilePicture = url;
        await user.save();
        return res.json({ url });
  
      } catch (e) {
        console.log(e)
        res.json({
          error: "User does not exist can not upload profile image"
        });
      }
    })
});

export default router;