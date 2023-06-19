import { IoFunctionProps } from "./index.type";
import { IoErrorEnums } from "../IoErrorEnums";

import * as models from "../../models";
import { Utils } from "../../utils";

export type onHeartFoodProps = {
    token: string;
    hearted: boolean;
    foodId: string;
}

export const onHeartFood = async ({ defaultProps: { io, socket }, customProps }: IoFunctionProps<onHeartFoodProps>) => {
    try {
        let user: models.Users;
        console.log( customProps );
        try {
            user = await Utils.getUserFromJsWebToken(customProps.token);
        }catch(e: any) {
            socket.emit("error", { errorMessage: e.message, timestamp: new Date(), errorCode: IoErrorEnums.JWT_ERROR, socketEvent: "onHeartFood" })
            return
        }

        let foodTruckFood = await models.FoodTrucksFood.findOne({ where: { id: customProps.foodId }});

        if ( !foodTruckFood ) {
            socket.emit("error", { errorMessage: "Food Does not exist.", timestamp: new Date(), errorCode: IoErrorEnums.REQUEST_ERROR, socketEvent: "onHeartFood" });
            return;
        }

        let findHearted = await models.UserFavoriteFood.findOne({ where: { user: { id: user.id }, foodTruckFood: { id: customProps.foodId } } });

        if ( findHearted ) {
            await findHearted.remove();
            socket.emit("onHeartFood", { hearted: false, foodId: customProps.foodId });

            return;
        }
        
        findHearted = await models.UserFavoriteFood.create({
            user,
            foodTruckFood
        }).save();

        socket.emit("onHeartFood", { hearted: true, foodId: customProps.foodId, foodSummary: await findHearted.getGraphQlSummary() });

    }catch(e: any) {
        console.log(e);
        socket.emit("error", { errorMessage: "Couldn't Like Food Try Again Later", timestamp: new Date(), errorCode: IoErrorEnums.UnExpectedServerError, socketEvent: "onHeartFood" })
    }
} 

