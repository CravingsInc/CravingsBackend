import { Resolver, Mutation, Arg, Query } from "type-graphql";

import URLPattern from 'url-pattern';

import * as models from "../models";
import { Utils } from "../utils";

@Resolver()
export class AnalysisResolver {
    @Mutation(returns => String)
    async createSiteHistory(@Arg('arg', () => models.SiteHistoryInput) arg: models.SiteHistoryInput) {
        let user: models.Users | models.Organizers | null = null;

        try {
            if (arg.craving === "events" && arg.token) user = await Utils.getUserFromJsWebToken(arg.token);
            else if (arg.craving === "ticket" && arg.token) user = await Utils.getOrganizerFromJsWebToken(arg.token);
        } catch (e) { console.log(e); }

        let urlVisited: models.UrlVisitedType = models.UrlVisitedType.HOME;

        let mainPattern = new URLPattern('(http(s)\\://)(:subdomain.):domain.:tld(\\::port)/:main(/*)');

        if ( !mainPattern.match(arg.urlFull) ) urlVisited = models.UrlVisitedType.HOME;
        else {

            if (mainPattern.match(arg.urlFull).main === "change-password") urlVisited = models.UrlVisitedType.CHANGE_PASSWORD;
            else if (mainPattern.match(arg.urlFull).main === "contact") urlVisited = models.UrlVisitedType.CONTACT;
            else if (mainPattern.match(arg.urlFull).main === "reserve") urlVisited = models.UrlVisitedType.RESERVE;
            else if (mainPattern.match(arg.urlFull).main === "home") urlVisited = models.UrlVisitedType.USER_HOME;
            else if (mainPattern.match(arg.urlFull).main === "events") {

                let mainDetailsPattern = new URLPattern('(http(s)\\://)(:subdomain.):domain.:tld(\\::port)/:main/:eventId(/*)')

                if (!mainDetailsPattern.match(arg.urlFull)) urlVisited = models.UrlVisitedType.EVENTS;
                else if (mainDetailsPattern.match(arg.urlFull).eventId !== undefined) {

                    let mainDetailsTickets = new URLPattern('(http(s)\\://)(:subdomain.):domain.:tld(\\::port)/:main/:eventId/ticket(*)')

                    if (!mainDetailsTickets.match(arg.urlFull)) urlVisited = models.UrlVisitedType.EVENTS_DETAILS;
                    else urlVisited = models.UrlVisitedType.EVENTS_DETAILS_TICKET;
                }
            }
            else if (mainPattern.match(arg.urlFull).main === "sign") urlVisited = models.UrlVisitedType.SIGN_IN;
            else if (mainPattern.match(arg.urlFull).main === "register") urlVisited = models.UrlVisitedType.REGISTER;

        }

        await models.SiteHistory.create({
            user: arg.craving === "events" ? (user as models.Users) : undefined,
            organizer: arg.craving === "ticket" ? (user as models.Organizers) : undefined,
            urlVisited,
            urlFull: arg.urlFull,
            isMobile: arg.isMobile,
            isTablet: arg.isTablet,
            isSmartTV: arg.isSmartTV,
            isWearable: arg.isWearable,
            isConsole: arg.isConsole,
            isEmbedded: arg.isEmbedded,
            isAndroid: arg.isAndroid,
            isWinPhone: arg.isWinPhone,
            isIOS: arg.isIOS,
            isChrome: arg.isChrome,
            isFireFox: arg.isFireFox,
            isSafari: arg.isSafari,
            isOpera: arg.isOpera,
            isIE: arg.isIE,
            isEdge: arg.isEdge,
            isYandex: arg.isYandex,
            isChromium: arg.isChromium,
            isMobileSafari: arg.isMobileSafari,
            isSamsungBrowser: arg.isSamsungBrowser
        }).save();

        return "Site History Saved";
    }
}
