interface GmailEmailServiceKey {
    type: string;
    project_id: string;
    private_key_id: string;
    private_key: string;
    client_email: string;
    client_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_x509_cert_url: string;
}

interface SpaceKeys {
    endpoint: string;
    accessKey: string;
    secretKey: string
}

let SpaceKeysConfig: SpaceKeys = !process.env.production ? require("../../../SpaceKeysConfig.json") : {
    endpoint: process.env.space_keys_endpoint,
    accessKey: process.env.space_keys_accessKey,
    secretKey: process.env.space_keys_secretKey
}

interface BasicAppConfig {
    GmailServicePassword: string;
    GoogleMapsApiKey: string;
    StripeKey: string;
    SeceretKey: string;
    PORT: number;
    CLEARDB_DATABASE_NEW_URL: string | undefined;
    NODE_ENV: string | undefined;
}

const BasicConfig: BasicAppConfig = {
    GoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",

    GmailServicePassword: process.env.gmailPWD || "",

    StripeKey: process.env.STRIPE_KEY || "",

    SeceretKey: process.env.SECRET_KEY || "shhhh",

    PORT: process.env.PORT ? parseInt(process.env.PORT) : 3555,

    CLEARDB_DATABASE_NEW_URL: process.env.CLEARDB_DATABASE_NEW_URL,

    NODE_ENV: process.env.NODE_ENV
}

interface AppConfig  {
    gmailEmailService: GmailEmailServiceKey;
    BasicConfig: BasicAppConfig;
    SpaceKeysConfig: SpaceKeys;
}

export const AppConfig: AppConfig = {
    gmailEmailService: !process.env.production ? require("../../../google-email-service.json") : {
        type: process.env.GMAIL_EMAIL_SERVICE_TYPE,
        project_id: process.env.GMAIL_EMAIL_SERVICE_PROJECT_ID,
        private_key_id: process.env.GMAIL_EMAIL_SERVICE_PRIVATE_KEY_ID,
        private_key: process.env.GMAIL_EMAIL_SERVICE_PRIVATE_KEY,
        client_email: process.env.GMAIL_EMAIL_SERVICE_CLIENT_EMAIL,
        client_id: process.env.GMAIL_EMAIL_SERVICE_CLIENT_ID,
        auth_uri: process.env.GMAIL_EMAIL_SERVICE_AUTH_URI,
        token_uri: process.env.GMAIL_EMAIL_SERVICE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.GMAIL_EMAIL_SERVICE_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.GMAIL_EMAIL_SERVICE_CLIENT_X509_CERT_URL
    },

    SpaceKeysConfig,

    BasicConfig
}