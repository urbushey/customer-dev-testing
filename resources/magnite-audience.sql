CREATE MATERIALIZED VIEW 46cf1c6eed0b4688a510e1db3e57c826 TAGS = ('_nio_interactive') AS WITH id_level_data AS (
    SELECT t._rosetta_stone.mobile_id_unique_identifier AS mobile_id_unique_identifier,
        MAX(
            CASE
                WHEN (
                    t._rosetta_stone.generational_cohort = 'Millennials'
                ) THEN 1
                ELSE 0
            END
        ) AS f1
    FROM company_data.ADDRESSABLE_AUDIENCE AS t
    WHERE (
            (
                t._rosetta_stone.mobile_id_unique_identifier.type IS NOT NULL
            )
            AND (
                t._rosetta_stone.mobile_id_unique_identifier."value" IS NOT NULL
            )
        )
    GROUP BY t._rosetta_stone.mobile_id_unique_identifier
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
FROM id_level_data