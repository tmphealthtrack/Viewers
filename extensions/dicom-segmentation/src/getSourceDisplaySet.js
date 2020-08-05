export default function getSourceDisplaySet(studies, segDisplaySet) {
  const referencedDisplaySet = _getReferencedDisplaySet(segDisplaySet, studies);

  segDisplaySet.load(referencedDisplaySet, studies);
  // TODO: and set it active.

  return referencedDisplaySet;
}

const _getReferencedDisplaySet = (segDisplaySet, studies) => {
  let allDisplaySets = [];

  // TODO -> Use the studymetadatamanager instead of studies object for more portability.
  // Use the studymetadatamanager on the segDisplaySets StudyInstanceUID.
  // Fix in ViewerMain and ConnectedStudyBrowser.

  studies.forEach(study => {
    allDisplaySets = allDisplaySets.concat(study.displaySets);
  });

  const otherDisplaySets = allDisplaySets.filter(
    ds => ds.displaySetInstanceUID !== segDisplaySet.displaySetInstanceUID
  );

  const ReferencedSeriesSequence = Array.isArray(
    segDisplaySet.metadata.ReferencedSeriesSequence
  )
    ? segDisplaySet.metadata.ReferencedSeriesSequence
    : [segDisplaySet.metadata.ReferencedSeriesSequence];

  const referencedSeriesInstanceUIDs = ReferencedSeriesSequence.map(
    ReferencedSeries => ReferencedSeries.SeriesInstanceUID
  );

  const referencedDisplaySet = otherDisplaySets.find(ds =>
    referencedSeriesInstanceUIDs.includes(ds.SeriesInstanceUID)
  );

  return referencedDisplaySet;
};