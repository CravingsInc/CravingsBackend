import { Resolver, Query, Mutation, Arg } from "type-graphql";
import * as models from "../models";

@Resolver()
export class TestResolver {
    @Query( () => Boolean )
    serverIsLive() {
        return true;
    }

    @Query( () => [ models.Users ])
    async getAllTestUsers() { return await models.Users.find() }

    @Query( () => [ models.Organizers ] )
    async getAllTestOrganizers() { return await models.Organizers.find() }
}
