import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, BaseEntity } from "typeorm"
import { ObjectType, Field, ID } from "type-graphql";
import { FoodTrucksFood } from "./FoodTrucksFood";
import { Users } from "./User";
import { FoodSummary } from "./types";
import { Utils } from "../utils";

@Entity()
@ObjectType()
export class UserFavoriteFood extends BaseEntity {
    @Field( () => ID )
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field( () => Users )
    @ManyToOne( () => Users, user => user.favoriteFoods, {onDelete: "CASCADE"} )
    user: Users;

    @Field( () => FoodTrucksFood )
    @ManyToOne( () => FoodTrucksFood, food => food.userFavoriteFood, {onDelete: "CASCADE"} )
    foodTruckFood: FoodTrucksFood;

    @Field()
    @CreateDateColumn()
    dateCreated: Date;

    async getGraphQlSummary() {
        let favoriteFood: ( { FTLong: number, FTLat: number, ULong: number | null, ULat: number | null } & FoodSummary) | undefined = await FoodTrucksFood.createQueryBuilder("ftf")
        .select(`
            ftf.id, ftf.foodName as name, ftf.profilePicture, ftf.cost as price,
            u.id = uff.userId as hearted,
            0 as miles, "-" as timeToDestination,
            ft.profilePicture as foodTruckProfilePicture, ft.truckName as foodTruckName,
            (
                select sum(quantity) from [user_cart_items] uci1 where uci1.foodTruckFoodId = ftf.id
            ) as orderCount,
            (
                select count(id) from [food_truck_rating] ftr1 where ftr1.truckId = ftr.id
            ) as foodTruckRatingsCount,
            (
                select avg(rating) from [food_truck_rating] ftr1 where ftr1.truckId = ftr.id
            ) as foodTruckRatingsAverage,
            ft.longitude as FTLong, ft.Latitude as FTLat,
            u.longitude as ULong, u.Latitude as ULat
        `)
        .leftJoin("food_trucks", "ft", "ft.id = ftf.ownerId")
        .leftJoin("user_favorite_food", "uff", "ftf.id = uff.foodTruckFoodId")
        .leftJoin("users", "u", `u.id = uff.userId`)
        .leftJoin("user_cart_items", "uci", "uci.foodTruckFoodId = ftf.id")
        .leftJoin("food_truck_rating", "ftr", "ftr.truckId = ft.id")
        .where(`uff.id = "${this.id}"`)
        .getRawOne()
        
        if ( !favoriteFood ) return {};

        let miles = Math.round(Utils.getMiles({ longitude: favoriteFood.ULong || 0, latitude: favoriteFood.ULat || 0 }, { longitude: favoriteFood.FTLong || 0, latitude: favoriteFood.FTLat || 0 }))
        
        return {
            id: favoriteFood.id,
            name: favoriteFood.name,
            profilePicture: favoriteFood.profilePicture,
            hearted: Boolean(favoriteFood.hearted) || false,
            miles: Utils.shortenMinutesToString(miles),
            timeToDestination: Utils.shortenMinutesToString(miles * 2), // To minitus per mile
            orderCount: favoriteFood.orderCount || 0,
            price: favoriteFood.price,
            foodTruckName: favoriteFood.foodTruckName,
            foodTruckProfilePicture: favoriteFood.foodTruckProfilePicture,
            foodTruckRatingsCount: favoriteFood.foodTruckRatingsCount,
            foodTruckRatingsAverage: favoriteFood.foodTruckRatingsAverage || 0
        }
    }
}
