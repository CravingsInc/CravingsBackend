import { Field, ID, ObjectType } from 'type-graphql';

@ObjectType()
export class FoodDetailsBuy {
    @Field( () => ID) id: string;

    @Field() name: string;

    @Field() profilePicture: string;

    @Field() ownerName: string;

    @Field() ownerPicture: string;

    @Field() ownerId: string;

    @Field() hearted: boolean;

    @Field() price: number;

    @Field() calories: number;

    @Field() description: string;
}
