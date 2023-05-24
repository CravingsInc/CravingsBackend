import { Resolver, Query, Mutation, Arg } from "type-graphql";

@Resolver()
export class TestResolver {
    @Query( () => Boolean )
    serverIsLive() {
        return true;
    }
}
