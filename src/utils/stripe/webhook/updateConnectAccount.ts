import { ConnectAccountType } from "../createConnectAccount";
import { checkAccountVerified } from "../connectAccountVerification";

import * as models from '../../../models';

export const updateConnectAccount = async ( accountId: string, userId: string, type: ConnectAccountType ) => {
    let accountVerified = await checkAccountVerified( accountId );

    if ( !accountVerified ) return { status: 200, message: 'Account not verified' };

    if ( type === ConnectAccountType.ORGANIZER ) {
        let organizer = await models.Organizers.findOne({ where: { stripeConnectId: accountId, id: userId } });

        if ( !organizer ) return { status: 404, message: 'Organizer not found' };

        organizer.stripeAccountVerified = true;
        
        await organizer.save();
    }

    return { status: 200, message: 'Account verified' };
}
