-- Audience filter query in 

I think the problem is we need an OR is not null for each of these 

WITH id_level_data AS (
    SELECT t._rosetta_stone.mobile_id_unique_identifier AS mobile_id_unique_identifier,
        t._rosetta_stone.sha256_hashed_email AS sha256_hashed_email,
        MAX(
            CASE
                WHEN t._rosetta_stone.generational_cohort = 'Generation Z' THEN 1
                ELSE 0
            END
        ) AS f1
    FROM company_data.ADDRESSABLE_AUDIENCE AS t
    WHERE t._rosetta_stone.mobile_id_unique_identifier.type IS NOT NULL
        AND t._rosetta_stone.mobile_id_unique_identifier.value IS NOT NULL
    GROUP BY t._rosetta_stone.mobile_id_unique_identifier,
        t._rosetta_stone.sha256_hashed_email
)
SELECT COUNT(
        CASE
            WHEN f1 = 1 THEN 1
            ELSE NULL
        END
    ) AS full_query_count,
    COUNT(
        CASE
            WHEN f1 = 1 THEN 1
            ELSE NULL
        END
    ) AS f1_count
FROM id_level_data
) 



--- Audience Filter Query in Narrative 1 
CREATE MATERIALIZED VIEW 7aa309d9604d423680ae4358e731e3f8 AS WITH id_level_data AS (
    SELECT t._rosetta_stone.sha256_hashed_email AS sha256_hashed_email,
        t._rosetta_stone.mobile_id_unique_identifier AS mobile_id_unique_identifier,
        MAX(
            CASE
                WHEN (
                    t._rosetta_stone.generational_cohort IN ('Generation X', 'Generation Z', 'Millennials')
                ) THEN 1
                ELSE 0
            END
        ) AS f1
    FROM company_data.Audience_Builder_Test_Dataset_ AS t
    WHERE (
            t._rosetta_stone.sha256_hashed_email.value <> 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
        )
        OR (
            (
                t._rosetta_stone.mobile_id_unique_identifier.type IS NOT NULL
            )
            AND (
                t._rosetta_stone.mobile_id_unique_identifier.value IS NOT NULL
            )
        )
    GROUP BY t._rosetta_stone.sha256_hashed_email,
        t._rosetta_stone.mobile_id_unique_identifier
)
SELECT COUNT(
        CASE
            WHEN (f1 = 1) THEN 1
        END
    ) AS full_query_count,
    COUNT(
        CASE
            WHEN f1 = 1 THEN 1
        END
    ) AS f1_count
FROM id_level_data -- Materialized View Query in Narrative 1: 
    CREATE MATERIALIZED VIEW test_name DISPLAY_NAME = 'Test_Name' DESCRIPTION = 'Test Description' TAGS = ('_nio_audience') AS
SELECT company_data.Audience_Builder_Test_Dataset_._rosetta_stone.sha256_hashed_email AS sha256_hashed_email,
    company_data.Audience_Builder_Test_Dataset_._rosetta_stone.mobile_id_unique_identifier AS mobile_id_unique_identifier
FROM company_data.Audience_Builder_Test_Dataset_
WHERE (
        company_data.Audience_Builder_Test_Dataset_._rosetta_stone.generational_cohort IN ('Generation X', 'Generation Z', 'Millennials')
    )
    AND (
        (
            (
                company_data.Audience_Builder_Test_Dataset_._rosetta_stone.sha256_hashed_email.value <> 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
            )
        )
        OR (
            (
                (
                    company_data.Audience_Builder_Test_Dataset_._rosetta_stone.mobile_id_unique_identifier.type IS NOT NULL
                )
                AND (
                    company_data.Audience_Builder_Test_Dataset_._rosetta_stone.mobile_id_unique_identifier.value IS NOT NULL
                )
            )
        )
    )