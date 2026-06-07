-- Idempotent schema for plants-oracle demo (run as SYSDBA against FREEPDB1).
ALTER SESSION SET CONTAINER = FREEPDB1;

BEGIN
    EXECUTE IMMEDIATE 'CREATE USER plants IDENTIFIED BY "PlantsDemo123" TEMPORARY TABLESPACE temp';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -1920 THEN
            RAISE;
        END IF;
END;
/

GRANT CONNECT, RESOURCE TO plants;
GRANT UNLIMITED TABLESPACE TO plants;

BEGIN
    EXECUTE IMMEDIATE '
        CREATE TABLE plants.plants (
            plant_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            common_name VARCHAR2(255) NOT NULL,
            latin_name VARCHAR2(255) NOT NULL,
            description VARCHAR2(4000) NOT NULL
        )';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -955 THEN
            RAISE;
        END IF;
END;
/

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM plants.plants;
    IF v_count = 0 THEN
        INSERT INTO plants.plants (common_name, latin_name, description)
        VALUES ('English oak', 'Quercus robur', 'Large deciduous tree native to Europe, valued for timber and acorns.');
        INSERT INTO plants.plants (common_name, latin_name, description)
        VALUES (
            'Lavender',
            'Lavandula angustifolia',
            'Fragrant Mediterranean shrub with purple flower spikes, used in gardens and aromatherapy.'
        );
        INSERT INTO plants.plants (common_name, latin_name, description)
        VALUES (
            'Tomato',
            'Solanum lycopersicum',
            'Widely cultivated fruiting plant originating in the Americas, staple in kitchens worldwide.'
        );
        INSERT INTO plants.plants (common_name, latin_name, description)
        VALUES (
            'Sunflower',
            'Helianthus annuus',
            'Tall annual with large yellow flower heads that track the sun when young.'
        );
        INSERT INTO plants.plants (common_name, latin_name, description)
        VALUES (
            'Rose',
            'Rosa gallica',
            'Classic ornamental shrub prized for fragrant flowers and long cultivation history.'
        );
        INSERT INTO plants.plants (common_name, latin_name, description)
        VALUES (
            'Basil',
            'Ocimum basilicum',
            'Aromatic herb essential to Mediterranean and Southeast Asian cooking.'
        );
        INSERT INTO plants.plants (common_name, latin_name, description)
        VALUES (
            'Grape vine',
            'Vitis vinifera',
            'Climbing plant cultivated for wine, table grapes, and raisins since antiquity.'
        );
        INSERT INTO plants.plants (common_name, latin_name, description)
        VALUES (
            'Bamboo',
            'Phyllostachys edulis',
            'Fast-growing woody grass used for construction, food shoots, and ornamental plantings.'
        );
        COMMIT;
    END IF;
END;
/
