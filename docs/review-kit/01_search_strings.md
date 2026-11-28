# Search strings (run the same concepts in every database)

Record for each database: name, platform, **date run**, the **exact string**, filters, and the **number of records returned**. Export every result (RIS or CSV with title and abstract). Those exports are your evidence, and the counts go straight into the PRISMA figure.

## Concepts
- **A. Setting:** "border crossing", "land border", "border post", "one-stop border", "cross-border travel", "port of entry"
- **B. People:** traveller, passenger, migrant, trader, "border official", "immigration officer", driver
- **C. Information and preparation:** "information needs", "information seeking", "information sources", preparedness, "pre-departure", "pre-arrival", awareness, "document requirements"

Combined as **A AND B AND C**, 2010 to 2026, English.

## Scopus (Advanced search)
```
TITLE-ABS-KEY(("border crossing" OR "land border" OR "border post*" OR "one-stop border" OR "cross-border travel*" OR "port* of entry") AND (travel* OR passenger* OR migrant* OR trader* OR "border official*" OR "immigration officer*" OR driver*) AND ("information need*" OR "information seeking" OR "information source*" OR preparedness OR "pre-departure" OR "pre-arrival" OR awareness OR "document* requirement*")) AND PUBYEAR > 2009 AND LANGUAGE(english)
```

## Web of Science (Topic search, Advanced)
```
TS=(("border crossing" OR "land border" OR "border post*" OR "one-stop border" OR "cross-border travel*" OR "port* of entry") AND (travel* OR passenger* OR migrant* OR trader* OR "border official*" OR "immigration officer*" OR driver*) AND ("information need*" OR "information seeking" OR "information source*" OR preparedness OR "pre-departure" OR "pre-arrival" OR awareness OR "document* requirement*")) AND PY=(2010-2026) AND LA=English
```

## EBSCOhost (Academic Search / Business Source / SocINDEX, search title, abstract and subjects)
```
(TI ("border crossing" OR "land border" OR "border post*" OR "one-stop border" OR "cross-border travel*" OR "port* of entry") OR AB (...same...)) AND (...population...) AND (...information...)
```
Limiters: 2010 to 2026, English. Tick "Full text" only for the retrieval step, not for the search itself.

## ProQuest / Emerald / Sage / Taylor & Francis / Springer / Wiley
Use the abstract field with the same three blocks. These platforms handle long strings badly, so split into Query 1 (information needs and sources) and Query 2 (preparedness and documents), run each, and **count the union once**.

## Google Scholar (free, via Publish or Perish)
Google Scholar cannot export. Use the free **Publish or Perish** software (harzing.com) to download up to 1,000 results per query to CSV with counts.
Queries (keep exactly these):
1. "border crossing" "information needs" travellers
2. "land border" travellers preparedness
3. "cross-border travel" "information sources" travellers
4. "one-stop border post" information travellers

## African Journals Online (AJOL) and DOAJ
Search the same concepts in simple form: `border information travellers`, `one-stop border post`, `cross-border traders information`. These are free and cover East African journals well.

## Other methods (report them separately in PRISMA)
- **Citation searching:** reference lists of every included study.
- **Websites:** DCIC, URA, UBOS, EAC, SAIIA, TradeMark Africa. Name the page and the date visited.
- **Studies you already know** (Nugent & Soi 2020, Wiseman 2023, and so on): include them **only if the database search also retrieves them, or list them under "other methods"**. Do not hide them.
