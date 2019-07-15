import scanMetadata from './stages/scan-metadata';
import generateWebsiteInfo from './stages/generate-website-info';
import generatePages from './stages/generate-pages';
import buildWebsite from './stages/build-website';
import runWebsite from './stages/run-website';

export default () => {
  const initialConfiguration = {};
  return scanMetadata(initialConfiguration, {})
    .then(result => generateWebsiteInfo(result, {}))
    .then(result => generatePages(result, {}))
    .then(result => buildWebsite(result, {}))
    .then(result => runWebsite(result, {}))
    .then(() => {
      console.log('Thanks for documenting with brisk-docs! 🎿');
    });
};
