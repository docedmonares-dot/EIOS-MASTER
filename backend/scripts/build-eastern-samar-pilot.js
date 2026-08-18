const db = require("../src/config/database");

const SURVEY_CODE = "EIOS-MASTER-RESEARCH-INSTRUMENT";
const LEGACY_SURVEY_CODE = "ES-SULAT-SAN-ISIDRO-PILOT";

const choiceLists = {
    YES_NO: [
        ["YES", "Oo"],
        ["NO", "Hindi"],
    ],
    TENACITY_OF_CHOICE: [
        ["WILL_NOT_CHANGE", "Will Not Change", "1"],
        ["WILL_CHANGE", "Will Change", "2"],
    ],
    RESIDENCY_TYPE: [
        ["BORN_HERE", "Ipinanganak sa lugar"],
        ["MOVED_HERE", "Lumipat mula sa ibang bayan o lungsod"],
    ],
    SETTLEMENT_CATEGORY: [
        ["RURAL", "Rural"],
        ["URBAN", "Urban"],
    ],
    SEX: [
        ["MALE", "Lalaki"],
        ["FEMALE", "Babae"],
        ["SELF_DESCRIBE", "Iba pa / nais ilarawan ng respondent"],
        ["PREFER_NOT", "Mas nais na hindi sumagot"],
    ],
    AGE_GROUP: [
        ["18_25", "18–25"],
        ["26_35", "26–35"],
        ["36_45", "36–45"],
        ["46_55", "46–55"],
        ["56_PLUS", "56 pataas"],
    ],
    INCOME_GROUP: [
        ["LE_17500", "₱17,500 pababa"],
        ["17501_35000", "₱17,501–₱35,000"],
        ["35001_75000", "₱35,001–₱75,000"],
        ["75001_100000", "₱75,001–₱100,000"],
        ["GT_100000", "Higit sa ₱100,000"],
        ["PREFER_NOT", "Mas nais na hindi sumagot"],
    ],
    CIVIL_STATUS: [
        ["SINGLE", "Single"],
        ["MARRIED", "Married"],
        ["SEPARATED", "Separated"],
        ["WIDOWED", "Widow / Widower"],
        ["SINGLE_PARENT", "Single Parent"],
        ["OTHER", "Iba pa"],
    ],
    RELIGION: [
        ["CATHOLIC", "Catholic"],
        ["PROTESTANT", "Protestant"],
        ["INC", "Iglesia ni Cristo"],
        ["OTHER_CHRISTIAN", "Ibang Christian denomination"],
        ["MUSLIM", "Muslim"],
        ["OTHER", "Iba pa"],
        ["NONE", "Walang relihiyon"],
        ["PREFER_NOT", "Mas nais na hindi sumagot"],
    ],
    EDUCATION: [
        ["NO_FORMAL", "Hindi nag-aral"],
        ["ELEMENTARY", "Elementary"],
        ["HIGH_SCHOOL", "High School"],
        ["VOCATIONAL", "Vocational / Technical"],
        ["COLLEGE", "College"],
        ["POST_GRADUATE", "Post Graduate"],
    ],
    OCCUPATION: [
        ["NATIONAL_GOV", "National Government"],
        ["LGU", "Local Government Unit"],
        ["PRIVATE", "Private Sector"],
        ["BUSINESS", "Sariling negosyo"],
        ["FARMER_FISHER", "Magsasaka / Mangingisda"],
        ["UNEMPLOYED", "Walang trabaho"],
        ["STUDENT", "Estudyante"],
        ["RETIRED", "Retirado"],
        ["OTHER", "Iba pa"],
    ],
    ELECTION_CONFIDENCE: [
        ["CLEAN", "Naniniwalang magiging malinis ang halalan"],
        ["DEPENDS", "Depende sa COMELEC at mga kandidato"],
        ["NOT_CLEAN", "Hindi naniniwalang magiging malinis ang halalan"],
        ["UNSURE", "Hindi tiyak / hindi alam"],
    ],
    VOTING_INTENT: [
        ["WILL_VOTE", "Boboto"],
        ["UNSURE", "Hindi pa tiyak kung boboto"],
        ["WILL_NOT_VOTE", "Hindi boboto"],
        ["NOT_ELIGIBLE", "Hindi rehistrado / hindi kwalipikado"],
    ],
    COMMUNITY_PROBLEM: [
        ["ABUSIVE_OFFICIALS", "Abusadong mga opisyal ng pamahalaan"],
        ["TRANSPORT", "Hindi maayos na sistema ng transportasyon"],
        ["HEALTH_FACILITIES", "Kakulangan ng health at birthing centers"],
        ["HEALTH_PROGRAMS", "Kakulangan ng mga programang pangkalusugan"],
        ["EDUCATION_COST", "Kapos sa panggastos para sa pag-aaral"],
        ["JOBS", "Kawalan ng trabaho at kabuhayan"],
        ["HOUSING", "Kawalan ng bahay o lupang tirahan"],
        ["HOSPITAL", "Kawalan ng hospital o health center"],
        ["DRAINAGE", "Kawalan ng kanal at daluyan ng tubig"],
        ["DRINKING_WATER", "Kawalan ng malinis na inuming tubig"],
        ["MEDICINES", "Kakulangan ng gamot sa mga health center"],
        ["FARMER_SUPPORT", "Kakulangan ng suporta sa magsasaka at mangingisda"],
        ["PUBLIC_SERVICE", "Hindi maayos na pakikitungo ng kawani ng pamahalaan"],
        ["CORRUPTION", "Korapsyon at katiwalian sa pamahalaan"],
        ["PERMITS", "Mabagal na pagproseso ng mga permit"],
        ["DISASTER_RESPONSE", "Pagtugon sa emergency at kalamidad"],
        ["ROAD_CONDITION", "Madumi, maalikabok, o sirang mga daan"],
        ["INTERNET", "Mahinang internet o data signal"],
        ["TAXES", "Mataas na bayarin sa buwis"],
        ["PRICES", "Mataas na presyo ng bilihin"],
        ["FLOODING", "Pagbaha sa daan, kanal, o ilog"],
        ["ILLEGAL_DRUGS", "Pagbebenta at paggamit ng ilegal na droga"],
        ["CRIME", "Paglaganap ng krimen"],
        ["FAVORITISM", "Palakasan sa pamahalaan"],
        ["WASTE", "Sistema ng pamamahala ng basura"],
        ["OFFICIAL_CAPABILITY", "Kakulangan sa kakayahan ng ilang opisyal"],
        ["OTHER", "Iba pang suliranin"],
    ],
    VOTING_INFLUENCE: [
        ["SERVICE_EXPERIENCE", "Karanasan sa paglilingkod"],
        ["COMMUNITY_LEADERS", "Pag-endorso ng mga lider sa komunidad"],
        ["PERSONALITY", "Magandang katangian at personalidad"],
        ["CAMPAIGN_MATERIALS", "Poster, jingle, at campaign materials"],
        ["PROGRAM", "Programa at plataporma sa pamamahala"],
        ["NATIONAL_LEADER", "Pag-endorso ng pambansang lider"],
        ["PROVINCIAL_LEADER", "Pag-endorso ng lider panlalawigan"],
        ["RELATIVES", "Pag-endorso ng mga kamag-anak"],
        ["BARANGAY_OFFICIALS", "Pag-endorso ng mga opisyal ng barangay"],
        ["SECTOR_LEADERS", "Pag-endorso ng mga lider ng sektor"],
        ["CHURCH", "Pag-endorso ng simbahan o religious group"],
        ["DISTRICT_LEADER", "Pag-endorso ng lider pandistrito"],
        ["ANTI_CORRUPTION", "Paninindigan laban sa korapsyon"],
        ["PEACE_ORDER", "Paninindigan laban sa droga at krimen"],
        ["INTIMIDATION", "Pananakot o pamimilit"],
        ["MEDIA", "Patalastas sa radyo, telebisyon, at social media"],
        ["VOTE_BUYING", "Pera o bagay na kapalit ng boto"],
        ["OTHER", "Iba pa"],
    ],
    AWARENESS: [
        ["AWARE", "Kilala"],
        ["NOT_AWARE", "Hindi kilala"],
        ["UNSURE", "Hindi tiyak"],
    ],
    SATISFACTION: [
        ["SATISFIED", "Nasisiyahan"],
        ["UNSURE", "Hindi alam / hindi tiyak"],
        ["DISSATISFIED", "Hindi nasisiyahan"],
    ],
    TRUST: [
        ["TRUST", "May tiwala"],
        ["UNSURE", "Hindi alam / hindi tiyak"],
        ["DISTRUST", "Walang tiwala"],
    ],
    CANDIDATE_QUALITY: [
        ["KNOWS_ISSUES", "Alam ang suliranin ng bayan at mamamayan"],
        ["OPEN_MINDED", "Bukas sa kaisipan at panukala ng iba"],
        ["POPULAR", "Kilala sa komunidad"],
        ["CONSULTATIVE", "Kumukonsulta at nakikinig sa mga tao"],
        ["ACCESSIBLE", "Madaling lapitan"],
        ["COURAGE", "May tapang at kakayahang mamuno"],
        ["CHARISMA", "Magandang personalidad at karisma"],
        ["INTEGRITY", "May integridad at malinis na pagkatao"],
        ["EXPERIENCE", "Malawak na karanasan sa paglilingkod"],
        ["COMMUNICATION", "Malinaw magsalita at madaling maunawaan"],
        ["EDUCATION", "May sapat na kaalaman at pinag-aralan"],
        ["GOVERNANCE", "May alam sa pamamahala"],
        ["LEADERSHIP", "May karanasan at mahusay na lider"],
        ["FAMILY", "May magandang reputasyon ang pamilya"],
        ["PRINCIPLED", "May paninindigan at prinsipyo"],
        ["PRO_POOR", "May malasakit sa mahihirap"],
        ["WEALTH", "May sariling kakayahang pinansyal"],
        ["GRASSROOTS", "Nakikisalamuha at bumababa sa mga barangay"],
    ],
    NEUTRAL_BALLOT: [
        ["CANDIDATE_A", "Candidate A (editable)"],
        ["CANDIDATE_B", "Candidate B (editable)"],
        ["CANDIDATE_C", "Candidate C (editable)"],
        ["CANDIDATE_D", "Candidate D (editable)"],
        ["UNDECIDED", "Wala pang napili"],
        ["WILL_NOT_VOTE", "Hindi boboto sa posisyong ito"],
        ["PREFER_NOT", "Mas nais na hindi sumagot"],
    ],
    PROGRAM_VOTE: [
        ["WILL_VOTE", "Iboboto"],
        ["UNSURE", "Hindi alam / hindi pa tiyak"],
        ["WILL_NOT_VOTE", "Hindi iboboto"],
    ],
};

const electionPositions = [
    { code: "PRESIDENT", name: "President", level: "NATIONAL", candidates: 6, maxSelections: 1 },
    { code: "VICE_PRESIDENT", name: "Vice President", level: "NATIONAL", candidates: 6, maxSelections: 1 },
    { code: "SENATOR", name: "Senator", level: "NATIONAL", candidates: 25, maxSelections: 12 },
    { code: "PARTY_LIST_REP", name: "Party-list Representative", level: "NATIONAL", candidates: 6, maxSelections: 1 },
    { code: "GOVERNOR", name: "Governor", level: "PROVINCIAL", candidates: 6, maxSelections: 1 },
    { code: "VICE_GOVERNOR", name: "Vice Governor", level: "PROVINCIAL", candidates: 6, maxSelections: 1 },
    { code: "BOARD_MEMBER", name: "Provincial Board Member", level: "PROVINCIAL", candidates: 8, maxSelections: 5, districtConfigurable: true },
    { code: "DISTRICT_REP", name: "District Representative", level: "PROVINCIAL", candidates: 6, maxSelections: 1, districtConfigurable: true },
    { code: "MAYOR", name: "Municipal Mayor", level: "MUNICIPALITY_CITY", candidates: 6, maxSelections: 1 },
    { code: "VICE_MAYOR", name: "Municipal Vice Mayor", level: "MUNICIPALITY_CITY", candidates: 6, maxSelections: 1 },
    { code: "COUNCILOR", name: "Municipal Councilor", level: "MUNICIPALITY_CITY", candidates: 15, maxSelections: 8, districtConfigurable: true },
    { code: "BARANGAY_CAPTAIN", name: "Barangay Captain", level: "BARANGAY", candidates: 6, maxSelections: 1 },
    { code: "BARANGAY_COUNCIL", name: "Barangay Council Member", level: "BARANGAY", candidates: 10, maxSelections: 7 },
];

for (const position of electionPositions) {
    const candidates = Array.from(
        { length: position.candidates },
        (_, index) => {
            const label = String.fromCharCode(65 + index);
            return [
                `${position.code}_CANDIDATE_${String(index + 1).padStart(2, "0")}`,
                `${position.name} Candidate ${label} (editable)`,
            ];
        }
    );

    if (position.maxSelections === 1) {
        candidates.push(["UNDECIDED", "Undecided"]);
    }

    choiceLists[`BALLOT_${position.code}`] = candidates;
}

const sections = [
    {
        code: "CONSENT_LOCATION",
        title: "Pahintulot at Lokasyon",
        description: "Informed consent, eligibility, and official Geographic Master location.",
        questions: [
            { type: "YES_NO", variable: "consent_given", text: "Matapos maipaliwanag ang layunin, pagiging kumpidensyal, at karapatang tumigil, kusang-loob po ba kayong pumapayag na lumahok sa survey?", choices: "YES_NO", required: true, sensitive: true },
            { type: "GEOGRAPHIC_SELECTOR", variable: "respondent_geographic_location", text: "Piliin ang opisyal na lokasyon ng respondent", required: true, sensitive: true, help: "Piliin ang Philippines / Region VIII / Eastern Samar / Sulat / San Isidro." },
            { type: "YES_NO", variable: "eligible_resident", text: "Kayo po ba ay 18 taong gulang pataas at naninirahan sa Barangay San Isidro nang hindi bababa sa anim na buwan?", choices: "YES_NO", required: true },
        ],
    },
    {
        code: "RESPONDENT_PROFILE",
        title: "Tala ng Respondent",
        description: "Minimum respondent profile for responsible disaggregation.",
        questions: [
            { type: "SINGLE_CHOICE", variable: "residency_type", text: "Ano ang uri ng inyong paninirahan sa lugar?", choices: "RESIDENCY_TYPE", required: true },
            { type: "SINGLE_CHOICE", variable: "settlement_category", text: "Paano ikinategorya ang inyong lugar?", choices: "SETTLEMENT_CATEGORY", required: true },
            { type: "SINGLE_CHOICE", variable: "respondent_sex", text: "Ano ang kasarian ng respondent?", choices: "SEX", required: true, sensitive: true },
            { type: "SINGLE_CHOICE", variable: "age_group", text: "Saang pangkat ng edad kabilang ang respondent?", choices: "AGE_GROUP", required: true },
            { type: "SINGLE_CHOICE", variable: "monthly_household_income", text: "Magkano ang kabuuang kita ng pamilya sa isang buwan?", choices: "INCOME_GROUP", required: true, sensitive: true },
            { type: "SINGLE_CHOICE", variable: "civil_status", text: "Ano ang estadong sibil ng respondent?", choices: "CIVIL_STATUS", required: true, sensitive: true },
            { type: "SINGLE_CHOICE", variable: "religion", text: "Ano ang relihiyon ng respondent?", choices: "RELIGION", required: false, sensitive: true },
            { type: "SINGLE_CHOICE", variable: "education_level", text: "Ano ang pinakamataas na antas ng pag-aaral na natapos?", choices: "EDUCATION", required: true },
            { type: "SINGLE_CHOICE", variable: "occupation", text: "Ano ang pangunahing trabaho o pinagkakakitaan?", choices: "OCCUPATION", required: true },
        ],
    },
    {
        code: "ELECTION_ATTITUDES",
        title: "Pananaw sa Halalan",
        description: "Neutral questions on election confidence and intention to participate.",
        questions: [
            { type: "SINGLE_CHOICE", variable: "election_cleanliness_belief", text: "Gaano kayo naniniwala na magiging malinis at maayos ang susunod na halalan?", choices: "ELECTION_CONFIDENCE", required: true, sensitive: true },
            { type: "SINGLE_CHOICE", variable: "voting_intention", text: "Ano ang inyong kasalukuyang paninindigan tungkol sa pagboto sa susunod na halalan?", choices: "VOTING_INTENT", required: true, sensitive: true },
        ],
    },
    {
        code: "COMMUNITY_PRIORITY",
        title: "Pangunahing Suliranin",
        description: "Single most important community problem for government attention.",
        questions: [
            { type: "SINGLE_CHOICE", variable: "top_community_problem", text: "Alin sa mga sumusunod ang pangunahing suliraning dapat unahing tugunan ng pamahalaan?", choices: "COMMUNITY_PROBLEM", required: true },
            { type: "LONG_TEXT", variable: "other_community_problem_detail", text: "Kung iba pa ang napili, pakitukoy ang pangunahing suliranin.", required: false },
        ],
    },
    {
        code: "VOTING_INFLUENCE",
        title: "Impluwensya at Katangian ng Kandidato",
        description: "Main voting influence and desired candidate quality.",
        questions: [
            { type: "SINGLE_CHOICE", variable: "main_voting_influence", text: "Ano ang pangunahing nakakaimpluwensya sa pagpili ninyo ng kandidato?", choices: "VOTING_INFLUENCE", required: true, sensitive: true },
            { type: "SINGLE_CHOICE", variable: "main_candidate_quality", text: "Ano ang pinakamahalagang katangiang dapat taglayin ng kandidatong inyong iboboto?", choices: "CANDIDATE_QUALITY", required: true, sensitive: true },
        ],
    },
    {
        code: "PUBLIC_FIGURE_EVALUATION",
        title: "Kakilala, Kasiyahan, at Tiwala",
        description: "Candidate awareness, satisfaction, and trust using governed integer codes and editable position rosters.",
        questions: electionPositions.map((position) => ({
            type: "CANDIDATE_EVALUATION",
            variable: `evaluate_${position.code.toLowerCase()}`,
            text: `Kakilala, kasiyahan, at tiwala sa mga kandidato para ${position.name}`,
            choices: `BALLOT_${position.code}`,
            required: true,
            sensitive: true,
            settings: {
                election_position: {
                    position_code: position.code,
                    position_name: position.name,
                    election_level: position.level,
                    is_applicable: true,
                    district_configurable: Boolean(position.districtConfigurable),
                },
                coding: {
                    awareness: { aware: 1, not_aware: 2 },
                    satisfaction: { satisfied: 1, neutral: 2, not_satisfied: 3 },
                    trust: { trust: 1, neutral: 2, distrust: 3 },
                    not_aware_auto_value: 2,
                },
            },
        })),
    },
    {
        code: "NEUTRAL_BALLOT_TESTS",
        title: "Neutral na Ballot Test",
        description: "Editable national, provincial, municipal, and barangay ballot positions with configurable selection limits.",
        questions: electionPositions.flatMap((position) => [
            {
                type: "BALLOT_SELECTOR",
                variable: `ballot_${position.code.toLowerCase()}`,
                text: `Kung ngayon gaganapin ang halalan, sino ang inyong pipiliin para ${position.name}?`,
                choices: `BALLOT_${position.code}`,
                required: true,
                sensitive: true,
                settings: {
                    election_position: {
                        position_code: position.code,
                        position_name: position.name,
                        election_level: position.level,
                        is_applicable: true,
                        min_selections: 1,
                        max_selections: position.maxSelections,
                        single_seat: position.maxSelections === 1,
                        include_undecided: position.maxSelections === 1,
                        district_configurable: Boolean(position.districtConfigurable),
                        evaluation_variable: `evaluate_${position.code.toLowerCase()}`,
                    },
                },
            },
            {
                type: "SINGLE_CHOICE",
                variable: `tenacity_${position.code.toLowerCase()}`,
                text: `May posibilidad bang baguhin ninyo ang kasalukuyang pinili para ${position.name} bago sumapit ang araw ng halalan?`,
                choices: "TENACITY_OF_CHOICE",
                required: true,
                sensitive: true,
                help: "Coding: 1 = Will Not Change; 2 = Will Change.",
                settings: {
                    election_position: {
                        position_code: position.code,
                        position_name: position.name,
                        is_applicable: true,
                        linked_ballot_variable: `ballot_${position.code.toLowerCase()}`,
                    },
                    analytics: {
                        measure: "TENACITY_OF_CHOICE",
                        coding: {
                            will_not_change: 1,
                            will_change: 2,
                        },
                    },
                },
            },
        ]),
    },
    {
        code: "PROGRAM_PERFORMANCE",
        title: "Kasiyahan, Tiwala, at Programa",
        description: "Provincial performance and neutral social-program evaluation.",
        questions: [
            { type: "SINGLE_CHOICE", variable: "provincial_officials_performance", text: "Sa pangkalahatan, kayo ba ay nasisiyahan sa performance ng mga pangunahing opisyal ng Eastern Samar?", choices: "SATISFACTION", required: true, sensitive: true },
            { type: "SINGLE_CHOICE", variable: "program_satisfaction", text: "Kayo ba ay nasisiyahan sa pagpapatupad ng 4Ps sa inyong lugar?", choices: "SATISFACTION", required: true, sensitive: true },
            { type: "SINGLE_CHOICE", variable: "program_trust", text: "Kayo ba ay nagtitiwala sa pamamahala ng 4Ps?", choices: "TRUST", required: true, sensitive: true },
            { type: "SINGLE_CHOICE", variable: "program_party_vote", text: "Ano ang inyong kasalukuyang paninindigan sa pagboto sa 4Ps Party-list?", choices: "PROGRAM_VOTE", required: true, sensitive: true },
        ],
    },
    {
        code: "INTERVIEW_COMPLETION",
        title: "Pagtatapos ng Panayam",
        description: "Enumerator observations and completion notes.",
        questions: [
            { type: "LONG_TEXT", variable: "enumerator_notes", text: "May mahalagang obserbasyon o pangyayaring dapat itala tungkol sa panayam?", required: false, sensitive: true },
        ],
    },
];

function listCode(key) {
    return `ES_PILOT_${key}`;
}

async function getRequiredContext(client) {
    const userResult = await client.query(
        "SELECT user_id FROM users WHERE status = 'active' ORDER BY created_at LIMIT 1"
    );
    const organizationResult = await client.query(
        "SELECT organization_id FROM organizations WHERE status = 'Active' ORDER BY is_primary_organization DESC, created_at LIMIT 1"
    );
    const coverageResult = await client.query(
        "SELECT coverage_level_id FROM survey_coverage_levels WHERE coverage_code = 'BARANGAY' AND is_active = TRUE LIMIT 1"
    );
    const geographyResult = await client.query(
        `SELECT barangay.geo_unit_id
         FROM geo_units barangay
         JOIN geo_units municipality ON municipality.geo_unit_id = barangay.parent_geo_unit_id
         JOIN geo_units province ON province.geo_unit_id = municipality.parent_geo_unit_id
         WHERE UPPER(barangay.unit_name) = 'SAN ISIDRO'
           AND UPPER(municipality.unit_name) = 'SULAT'
           AND UPPER(province.unit_name) = 'EASTERN SAMAR'
         LIMIT 1`
    );
    const typeResult = await client.query(
        "SELECT question_type_id, type_code FROM question_types WHERE is_active = TRUE"
    );

    if (!userResult.rows[0] || !organizationResult.rows[0] || !coverageResult.rows[0] || !geographyResult.rows[0]) {
        throw new Error("Required enterprise user, organization, Barangay coverage, or San Isidro geography was not found.");
    }

    return {
        userId: userResult.rows[0].user_id,
        organizationId: organizationResult.rows[0].organization_id,
        coverageLevelId: coverageResult.rows[0].coverage_level_id,
        geoUnitId: geographyResult.rows[0].geo_unit_id,
        questionTypes: new Map(typeResult.rows.map((row) => [row.type_code, row.question_type_id])),
    };
}

async function upsertChoiceList(client, key, choices, userId) {
    const code = listCode(key);
    const listResult = await client.query(
        `INSERT INTO question_choice_lists (
            choice_list_code, choice_list_name, description, source_type,
            category_code, is_system_list, is_active, created_by, updated_by
         ) VALUES ($1, $2, $3, 'Manual', 'PILOT_RESEARCH', FALSE, TRUE, $4, $4)
         ON CONFLICT (choice_list_code) DO UPDATE SET
            choice_list_name = EXCLUDED.choice_list_name,
            description = EXCLUDED.description,
            is_active = TRUE,
            updated_by = EXCLUDED.updated_by,
            updated_at = NOW()
         RETURNING choice_list_id`,
        [code, `Eastern Samar Pilot — ${key.replaceAll("_", " ")}`, "Editable neutral choices for the San Isidro pilot instrument.", userId]
    );

    const choiceListId = listResult.rows[0].choice_list_id;
    await client.query("DELETE FROM question_choices WHERE choice_list_id = $1", [choiceListId]);

    for (const [index, [choiceCode, label, choiceValue = choiceCode]] of choices.entries()) {
        await client.query(
            `INSERT INTO question_choices (
                choice_list_id, choice_code, choice_label, text_value,
                display_order, is_exclusive, is_other_option, is_none_option,
                is_refuse_option, metadata_json, created_by, updated_by
             ) VALUES ($1, $2, $3, $10, $4, $5, $6, $7, $8, '{}'::jsonb, $9, $9)`,
            [
                choiceListId,
                choiceCode,
                label,
                index + 1,
                ["UNDECIDED", "UNSURE", "PREFER_NOT", "WILL_NOT_VOTE", "NOT_ELIGIBLE"].includes(choiceCode),
                choiceCode === "OTHER",
                ["NONE", "UNDECIDED"].includes(choiceCode),
                choiceCode === "PREFER_NOT",
                userId,
                choiceValue,
            ]
        );
    }

    return choiceListId;
}

async function buildPilot() {
    const client = await db.connect();

    try {
        await client.query("BEGIN");
        const context = await getRequiredContext(client);
        const choiceListIds = new Map();

        await client.query(
            `UPDATE surveys
             SET survey_code = $1,
                 updated_at = NOW()
             WHERE survey_code = $2
               AND NOT EXISTS (
                   SELECT 1 FROM surveys WHERE survey_code = $1
               )`,
            [SURVEY_CODE, LEGACY_SURVEY_CODE]
        );

        for (const [key, choices] of Object.entries(choiceLists)) {
            choiceListIds.set(key, await upsertChoiceList(client, key, choices, context.userId));
        }

        const surveyResult = await client.query(
            `INSERT INTO surveys (
                survey_code, survey_name, geographic_scope, description, status,
                organization_id, coverage_level_id, survey_purpose,
                research_objectives, target_population, unit_of_analysis,
                methodology_summary, planned_start_date, planned_end_date,
                project_owner_user_id, configuration_json, publication_status,
                created_by, updated_by
             ) VALUES (
                $1, $2, 'Barangay', $3, 'Draft', $4, $5, $6, $7, $8, $9,
                $10, CURRENT_DATE, CURRENT_DATE + 14, $11, $12::jsonb, 'Draft', $11, $11
             )
             ON CONFLICT (survey_code) DO UPDATE SET
                survey_name = EXCLUDED.survey_name,
                description = EXCLUDED.description,
                organization_id = EXCLUDED.organization_id,
                coverage_level_id = EXCLUDED.coverage_level_id,
                survey_purpose = EXCLUDED.survey_purpose,
                research_objectives = EXCLUDED.research_objectives,
                target_population = EXCLUDED.target_population,
                unit_of_analysis = EXCLUDED.unit_of_analysis,
                methodology_summary = EXCLUDED.methodology_summary,
                configuration_json = EXCLUDED.configuration_json,
                updated_by = EXCLUDED.updated_by,
                updated_at = NOW()
             RETURNING survey_id`,
            [
                SURVEY_CODE,
                "EIOS Master Research Instrument",
                "Governed mother instrument for configurable Benchmarking and Tracking surveys, election research, rider modules, census work, and client-specific derived instruments.",
                context.organizationId,
                context.coverageLevelId,
                "Reusable master instrument for Benchmarking, Tracking, electoral research, community intelligence, and configurable client studies",
                "Provide a governed library of editable sections, questions, candidate rosters, ballot configurations, and rider modules that may be included or excluded without source-code changes.",
                "Residents aged 18 years and above who have lived in Barangay San Isidro, Sulat, Eastern Samar for at least six months",
                "Individual adult resident",
                "Pilot household survey using one eligible adult respondent per sampled household, informed consent, official Geographic Master selection, mobile GPS integrity checks, offline-first collection, and supervisor review.",
                context.userId,
                JSON.stringify({
                    schema: "eios.master-research-instrument.v1",
                    instrument_role: "MASTER_TEMPLATE",
                    supported_study_modes: ["BENCHMARKING", "TRACKING"],
                    supported_coverage_levels: [
                        "NATIONAL",
                        "PROVINCE",
                        "LEGISLATIVE_DISTRICT",
                        "MUNICIPALITY_CITY",
                        "BARANGAY"
                    ],
                    configurable_modules: true,
                    questions_are_editable: true,
                    questions_can_be_included_or_excluded: true,
                    sections_can_be_included_or_excluded: true,
                    rider_catalog: [
                        "ONE_ON_ONE_PREFERENCE",
                        "TOP_CHOICE",
                        "ALTERNATIVE_CHOICE",
                        "PREFERRED_TANDEM",
                        "VOTE_BUYING_EXTENT_AND_IMPACT",
                        "PAST_VOTE_RECALL",
                        "SLOGAN_TEST",
                        "BRAND_ARCHITECTURE_TEST"
                    ],
                    instrument_language: "Filipino",
                    candidate_labels_are_editable: true,
                    pilot_area: {
                        province: "Eastern Samar",
                        municipality: "Sulat",
                        barangay: "San Isidro",
                        official_code: "0802622011",
                    },
                    source_adaptation: {
                        duplicated_sections_removed: true,
                        outdated_years_neutralized: true,
                        personal_names_neutralized: true,
                        age_bands_corrected: true,
                    },
                }),
            ]
        );

        const surveyId = surveyResult.rows[0].survey_id;

        await client.query("DELETE FROM survey_questionnaire_items WHERE survey_id = $1", [surveyId]);
        await client.query("DELETE FROM survey_local_questions WHERE survey_id = $1", [surveyId]);
        await client.query("DELETE FROM survey_sections WHERE survey_id = $1", [surveyId]);
        await client.query("DELETE FROM survey_geographic_coverage WHERE survey_id = $1", [surveyId]);

        await client.query(
            `INSERT INTO survey_geographic_coverage (
                survey_id, geo_unit_id, coverage_role, selection_method,
                is_sampling_domain, is_required_coverage, is_locked_for_field_users,
                display_order, configuration_json, status, created_by, updated_by
             ) VALUES ($1, $2, 'Root', 'Configured', TRUE, TRUE, TRUE, 1, $3::jsonb, 'Active', $4, $4)`,
            [surveyId, context.geoUnitId, JSON.stringify({ official_code: "0802622011", pilot: true }), context.userId]
        );

        let globalSortOrder = 1;

        for (const [sectionIndex, section] of sections.entries()) {
            const sectionResult = await client.query(
                `INSERT INTO survey_sections (
                    survey_id, section_code, section_title, section_description,
                    page_number, sort_order, section_type, settings_json,
                    is_active, created_by, updated_by
                 ) VALUES ($1, $2, $3, $4, $5, $5, 'Standard', '{}'::jsonb, TRUE, $6, $6)
                 RETURNING section_id`,
                [surveyId, section.code, section.title, section.description, sectionIndex + 1, context.userId]
            );

            const sectionId = sectionResult.rows[0].section_id;

            for (const [questionIndex, question] of section.questions.entries()) {
                const questionTypeId = context.questionTypes.get(question.type);
                if (!questionTypeId) {
                    throw new Error(`Question type ${question.type} is unavailable.`);
                }

                const choiceListId = question.choices ? choiceListIds.get(question.choices) : null;
                const localQuestionResult = await client.query(
                    `INSERT INTO survey_local_questions (
                        survey_id, section_id, question_type_id, choice_list_id,
                        question_code, variable_name, question_text, question_description,
                        help_text, placeholder_text, required_flag, default_value_json,
                        validation_rules_json, appearance_json, settings_json, metadata_json,
                        logic_enabled, is_sensitive, is_personally_identifiable,
                        page_number, sort_order, question_status, is_active,
                        created_by, updated_by
                     ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, NULL, $10,
                        '{}'::jsonb, '[]'::jsonb, '{}'::jsonb, $11::jsonb, $12::jsonb,
                        FALSE, $13, FALSE, $14, $15, 'Draft', TRUE, $16, $16
                     ) RETURNING local_question_id`,
                    [
                        surveyId,
                        sectionId,
                        questionTypeId,
                        choiceListId,
                        `PILOT_${question.variable.toUpperCase()}`,
                        question.variable,
                        question.text,
                        null,
                        question.help || null,
                        Boolean(question.required),
                        JSON.stringify(question.settings || {}),
                        JSON.stringify({ source_instrument: "Eastern Samar neutral pilot", editable_labels: true }),
                        Boolean(question.sensitive),
                        sectionIndex + 1,
                        questionIndex + 1,
                        context.userId,
                    ]
                );

                await client.query(
                    `INSERT INTO survey_questionnaire_items (
                        survey_id, section_id, local_question_id, item_source,
                        page_number, sort_order, required_override,
                        item_settings_json, is_active, created_by, updated_by
                     ) VALUES ($1, $2, $3, 'Survey Local', $4, $5, $6, '{}'::jsonb, TRUE, $7, $7)`,
                    [
                        surveyId,
                        sectionId,
                        localQuestionResult.rows[0].local_question_id,
                        sectionIndex + 1,
                        globalSortOrder,
                        Boolean(question.required),
                        context.userId,
                    ]
                );

                globalSortOrder += 1;
            }
        }

        await client.query("COMMIT");

        console.table({
            survey_code: SURVEY_CODE,
            survey_id: surveyId,
            pilot_area: "San Isidro, Sulat, Eastern Samar",
            sections: sections.length,
            questions: globalSortOrder - 1,
            neutral_editable_choice_lists: choiceListIds.size,
            status: "Draft",
        });
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
        await db.end();
    }
}

buildPilot().catch((error) => {
    console.error("Unable to build the Eastern Samar pilot instrument:", error);
    process.exit(1);
});
