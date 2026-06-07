IF DB_ID(N'animals') IS NULL
BEGIN
    CREATE DATABASE animals;
END;
GO

USE animals;
GO

IF OBJECT_ID(N'dbo.animals', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.animals (
        animal_id INT IDENTITY(1, 1) NOT NULL PRIMARY KEY,
        common_name NVARCHAR(255) NOT NULL,
        latin_name NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX) NOT NULL
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.animals)
BEGIN
    INSERT INTO dbo.animals (common_name, latin_name, description) VALUES
        (N'Domestic dog', N'Canis familiaris', N'Domesticated carnivore and common companion animal, descended from wolves.'),
        (N'Domestic cat', N'Felis catus', N'Small carnivorous mammal kept as a pet; skilled hunter of rodents and birds.'),
        (N'Red fox', N'Vulpes vulpes', N'Widespread wild canid with a bushy tail; adaptable to forests, farmland, and urban edges.'),
        (N'Brown bear', N'Ursus arctos', N'Large omnivorous bear found across northern forests and mountains in Eurasia and North America.'),
        (N'Bottlenose dolphin', N'Tursiops truncatus', N'Highly social marine mammal known for intelligence, echolocation, and coastal habitats.'),
        (N'Red kangaroo', N'Osphranter rufus', N'Large marsupial from Australia; powerful hind legs used for hopping over open grassland.'),
        (N'Emperor penguin', N'Aptenodytes forsteri', N'Tallest penguin species; breeds on Antarctic sea ice and dives deep for fish and squid.'),
        (N'Giant panda', N'Ailuropoda melanoleuca', N'Bear native to China; diet is almost entirely bamboo despite belonging to the order Carnivora.');
END;
GO
