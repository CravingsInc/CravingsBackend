import express from "express";
const multer = require("multer");

import * as models from '../../models';
import { Utils, s3 } from "../../utils";
import { stripe } from "../../utils/stripe";

const router = express.Router();

router.post('/upload/banner', ( req: any, res: any ) => {
    const upload = multer().single("image");

    upload( req, res, async function ( err: any ) {
        if ( req.fileValidationError ) return res.send( req.fileValidationError );

        else if ( !req.file ) return res.json({ error: "Please select an image to upload" });

        else if ( err instanceof multer.MulterError ) return res.send(err);

        else if ( err ) return res.send(err);

        try {
            let org: models.Organizers | undefined = undefined;
            
            Utils.verifyRequestParams( req.body, [ "token" ]);

            org = await Utils.getOrganizerFromJsWebToken( req.body.token );

            let url = await s3.uploadImage( req.file, req.file.mimetype );
            org.banner = url;
            await org.save();
            return res.json({ url });
        }catch ( e ) {
            console.log( e );
            res.json({
                error: "Organizer does not exist, can not upload banner"
            })
        }
    })
});

router.get('/stripe/login/:token', async ( req: any, res: any ) => {
    const token = req.params.token;

    if ( !token ) return res.status(400).json({ error: "No token given" });

    let org: models.Organizers | models.OrganizerMembers | undefined = undefined;

    try {
        org = await Utils.getOrganizerFromJsWebToken( token );
    }catch ( e ) {
        console.log( e );
        
        try {
            let orgMember = await Utils.getOrganizerMemberFromJsWebToken( token );

            if ( orgMember ) {
                if ( orgMember.title !== 'Admin' ) return res.status(400).json({ error: "You are not an admin" });
                org = orgMember.organizer;
            }
        }
        catch ( e ) {
            console.log( e );
            return res.status(400).json({ error: "Invalid token" });
        }
    }

    if ( !org ) return res.status(400).json({ error: "Invalid token" });

    try {
        let loginUrl = await stripe.accounts.createLoginLink( org.stripeConnectId );

        return res.redirect( loginUrl.url );
    }catch ( e ) {
        console.log( e );
        return res.status(500).json({ error: "Could not create login link" });
    }
});

export default router;
