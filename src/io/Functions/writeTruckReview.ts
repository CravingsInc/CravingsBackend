import { IoFunctionProps } from "./index.type";
import { IoErrorEnums } from "../IoErrorEnums";

import * as models from "../../models";
import { Utils } from "../../utils";

export type onWriteTruckReviewProps = {
    token: string;
    truckId: string;
    review: string;
    rating: number;
}

export const onWriteTruckReview = async ({ defaultProps: { io, socket }, customProps }: IoFunctionProps<onWriteTruckReviewProps> ) => {
    try {
        let user: models.Users;

        try {
            user = await Utils.getUserFromJsWebToken(customProps.token);
        }catch(e : any) {
            socket.emit("error", { errorMessage: e.message, timestamp: new Date(), errorCode: IoErrorEnums.JWT_ERROR, socketEvent: "onWriteTruckReview" })
            return
        }

        let foodTruck = await models.FoodTrucks.findOne({ where: { id: customProps.truckId }});

        if ( !foodTruck ) {
            socket.emit("error", { errorMessage: "Food Truck Does not exist.", timestamp: new Date(), errorCode: IoErrorEnums.REQUEST_ERROR, socketEvent: "onWriteTruckReview" });
            return;
        }

        let foodTruckReview = await models.FoodTruckRating.create({
            rating: customProps.rating,
            description: customProps.review,
            user: { id: user.id },
            truck: { id: foodTruck.id }
        }).save()

        socket.emit("onWriteTruckReview", { id: foodTruckReview.id, name: user.username, profilePicture: user.profilePicture, comment: foodTruckReview.description, rating: foodTruckReview.rating })


    }catch( e: any ) {
        console.log(e);
        socket.emit("error", { errorMessage: "Couldnt save food truck review. Try Again Later", timestamp: new Date(), errorCode: IoErrorEnums.UnExpectedServerError, socketEvent: "onWriteTruckReview" });
    }
}
