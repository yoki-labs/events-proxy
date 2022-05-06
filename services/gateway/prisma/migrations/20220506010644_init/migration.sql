-- CreateTable
CREATE TABLE "Bot" (
    "id" SERIAL NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "ownerId" VARCHAR(255) NOT NULL,
    "botId" VARCHAR(255) NOT NULL,
    "endpointURL" VARCHAR(255) NOT NULL,

    CONSTRAINT "Bot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Request" (
    "id" SERIAL NOT NULL,
    "botId" VARCHAR(255) NOT NULL,
    "eventType" VARCHAR(255) NOT NULL,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);
