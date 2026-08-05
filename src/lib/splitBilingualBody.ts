export interface BilingualBody {
  en: string;
  pt: string;
}

const EN_HEADING = /^##\s*EN\s*$/m;
const PT_HEADING = /^##\s*PT\s*$/m;

export function splitBilingualBody(body: string): BilingualBody {
  const enIndex = body.search(EN_HEADING);
  const ptIndex = body.search(PT_HEADING);

  if (enIndex === -1 || ptIndex === -1) {
    throw new Error(
      'Destination body must contain both "## EN" and "## PT" sections'
    );
  }

  const enHeadingLine = body.slice(enIndex).match(EN_HEADING)![0];
  const ptHeadingLine = body.slice(ptIndex).match(PT_HEADING)![0];

  const firstIndex = Math.min(enIndex, ptIndex);
  const secondIndex = Math.max(enIndex, ptIndex);
  const firstIsEn = firstIndex === enIndex;

  const firstSection = body.slice(firstIndex, secondIndex);
  const secondSection = body.slice(secondIndex);

  const stripHeading = (section: string, headingLine: string) =>
    section.slice(section.indexOf(headingLine) + headingLine.length).trim();

  return {
    en: stripHeading(firstIsEn ? firstSection : secondSection, enHeadingLine),
    pt: stripHeading(firstIsEn ? secondSection : firstSection, ptHeadingLine),
  };
}
