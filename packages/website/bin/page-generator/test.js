import path from 'path';
import fs from 'fs';
import { copyFixtureIntoTempDir, createTempDir } from 'jest-fixtures';

import mockCreateBuilder from './build-externals';
import generatePages from './index';

jest.mock('./build-externals');

// TODO: refactor this test suite so such a messy mock is no longer needed
const mockModuleBuilder = packagesCwd => {
  const createMockBundle = (packageName, exampleName) => ({
    source: path.join(
      packagesCwd,
      'packages',
      packageName,
      'examples',
      exampleName,
    ),
    dest: 'bundles/mp1-example1.js',
  });

  mockCreateBuilder.mockImplementation(() => ({
    run: () => Promise.resolve(),
    bundles: [
      createMockBundle('mock-package1', 'example1.js'),
      createMockBundle('mock-package1', 'example2.js'),
      createMockBundle('mock-package1', 'example3.js'),
      createMockBundle('mock-package2', 'example1.js'),
      createMockBundle('mock-package2', 'example2.js'),
      createMockBundle('mock-package2', 'example3.js'),
      createMockBundle('mock-package3', 'example1.js'),
      createMockBundle('mock-package3', 'example2.js'),
      createMockBundle('mock-package3', 'example3.js'),
    ],
  }));
};

describe('Generate pages', () => {
  let packagesPaths;
  let pagesPath;
  let sitemap;

  beforeAll(async () => {
    const packagesCwd = await copyFixtureIntoTempDir(
      __dirname,
      'simple-mock-packages',
    );

    const docsCwd = await copyFixtureIntoTempDir(__dirname, 'simple-mock-docs');

    packagesPaths = [path.join(packagesCwd, 'packages', '/*')];
    const docsPath = path.join(docsCwd, 'docs');
    pagesPath = await createTempDir();
    const componentsPath = await createTempDir();
    const bundlesPath = await createTempDir();

    mockModuleBuilder(packagesCwd);

    sitemap = await generatePages(
      packagesPaths,
      docsPath,
      pagesPath,
      componentsPath,
      bundlesPath,
    );
  });

  describe('package pages generation', () => {
    it('creates a home page per package', () => {
      expect(
        fs.existsSync(
          path.join(pagesPath, 'packages', 'mock-package1', 'index.js'),
        ),
      ).toEqual(true);
      expect(
        fs.existsSync(
          path.join(pagesPath, 'packages', 'mock-package2', 'index.js'),
        ),
      ).toEqual(true);
      expect(
        fs.existsSync(
          path.join(pagesPath, 'packages', 'mock-package2', 'index.js'),
        ),
      ).toEqual(true);
    });

    it('creates docs pages for each package', () => {
      const assertDocs = packageId => {
        const packageDocsPath = path.join(
          pagesPath,
          'packages',
          packageId,
          'docs',
        );
        expect(fs.existsSync(path.join(packageDocsPath, 'index.js'))).toEqual(
          true,
        );
        expect(
          fs.existsSync(path.join(packageDocsPath, 'extended-info.js')),
        ).toEqual(true);
        expect(
          fs.existsSync(path.join(packageDocsPath, 'special-usecase.js')),
        ).toEqual(true);
      };

      assertDocs('mock-package1');
      assertDocs('mock-package2');
      assertDocs('mock-package3');
    });

    it('creates examples pages for each package', () => {
      const assertDocs = packageId => {
        const packageExamplesPath = path.join(
          pagesPath,
          'packages',
          packageId,
          'examples',
        );
        expect(
          fs.existsSync(path.join(packageExamplesPath, 'index.js')),
        ).toEqual(true);
        expect(
          fs.existsSync(path.join(packageExamplesPath, 'example1.js')),
        ).toEqual(true);
        expect(
          fs.existsSync(path.join(packageExamplesPath, 'example2.js')),
        ).toEqual(true);
        expect(
          fs.existsSync(path.join(packageExamplesPath, 'example3.js')),
        ).toEqual(true);
      };

      assertDocs('mock-package1');
      assertDocs('mock-package2');
      assertDocs('mock-package3');
    });

    describe('sitemap generation', () => {
      let packagesSitemap;

      beforeAll(() => {
        packagesSitemap = sitemap.packages;
      });

      it('gets the id for each package', () => {
        expect(packagesSitemap[0].packageId).toEqual('mock-package1');
        expect(packagesSitemap[1].packageId).toEqual('mock-package2');
        expect(packagesSitemap[2].packageId).toEqual('mock-package3');
      });

      it('gets the home page path for each package', () => {
        expect(packagesSitemap[0].homePath).toEqual('/packages/mock-package1');
        expect(packagesSitemap[1].homePath).toEqual('/packages/mock-package2');
        expect(packagesSitemap[2].homePath).toEqual('/packages/mock-package3');
      });

      it('gets the docs pages for each package', () => {
        const assertDocs = (docs, packageId) => {
          const packageDocsPath = path.join('/', 'packages', packageId, 'docs');

          expect(docs).toEqual([
            {
              id: 'extended-info',
              pagePath: path.join(packageDocsPath, 'extended-info'),
            },
            {
              id: 'special-usecase',
              pagePath: path.join(packageDocsPath, 'special-usecase'),
            },
          ]);
        };

        assertDocs(packagesSitemap[0].docs, 'mock-package1');
        assertDocs(packagesSitemap[1].docs, 'mock-package2');
        assertDocs(packagesSitemap[2].docs, 'mock-package3');
      });

      it('gets the examples pages for each package', () => {
        const assertDocs = (examples, packageId) => {
          const packageDocsPath = path.join(
            '/',
            'packages',
            packageId,
            'examples',
          );

          expect(examples).toEqual([
            {
              id: 'example1',
              pagePath: path.join(packageDocsPath, 'example1'),
              isolatedPath: path.join(packageDocsPath, 'isolated/example1'),
            },
            {
              id: 'example2',
              pagePath: path.join(packageDocsPath, 'example2'),
              isolatedPath: path.join(packageDocsPath, 'isolated/example2'),
            },
            {
              id: 'example3',
              pagePath: path.join(packageDocsPath, 'example3'),
              isolatedPath: path.join(packageDocsPath, 'isolated/example3'),
            },
          ]);
        };

        assertDocs(packagesSitemap[0].examples, 'mock-package1');
        assertDocs(packagesSitemap[1].examples, 'mock-package2');
        assertDocs(packagesSitemap[2].examples, 'mock-package3');
      });

      it('gets the docs folder path for each package', () => {
        expect(packagesSitemap[0].docPath).toEqual(
          '/packages/mock-package1/docs',
        );
        expect(packagesSitemap[1].docPath).toEqual(
          '/packages/mock-package2/docs',
        );
        expect(packagesSitemap[2].docPath).toEqual(
          '/packages/mock-package3/docs',
        );
      });

      it('gets the examples folder path for each package', () => {
        expect(packagesSitemap[0].examplePath).toEqual(
          '/packages/mock-package1/examples',
        );
        expect(packagesSitemap[1].examplePath).toEqual(
          '/packages/mock-package2/examples',
        );
        expect(packagesSitemap[2].examplePath).toEqual(
          '/packages/mock-package3/examples',
        );
      });
    });
  });

  describe('docs pages generation', () => {
    it('creates pages for each markdown file', () => {
      expect(fs.existsSync(path.join(pagesPath, 'docs', 'doc-1.js'))).toEqual(
        true,
      );
      expect(fs.existsSync(path.join(pagesPath, 'docs', 'doc-2.js'))).toEqual(
        true,
      );
      expect(
        fs.existsSync(path.join(pagesPath, 'docs', 'doc-3', 'doc-3-1.js')),
      ).toEqual(true);
      expect(
        fs.existsSync(
          path.join(pagesPath, 'docs', 'doc-3', 'doc-3-2', 'doc-3-2-1.js'),
        ),
      ).toEqual(true);
    });

    describe('sitemap generation', () => {
      let docsSitemap;

      beforeAll(() => {
        docsSitemap = sitemap.docs;
      });

      it('gets ids for all docs from the filesystem structure', () => {
        expect(docsSitemap[0].id).toEqual('doc-1');
        expect(docsSitemap[1].id).toEqual('doc-2');
        expect(docsSitemap[2].id).toEqual('doc-3');

        // nested docs
        expect(docsSitemap[2].children[0].id).toEqual('doc-3-1');
        expect(docsSitemap[2].children[1].id).toEqual('doc-3-2');
        expect(docsSitemap[2].children[1].children[0].id).toEqual('doc-3-2-1');
      });

      it('gets url paths for all docs pages in the filesystem structure', () => {
        expect(docsSitemap[0].pagePath).toEqual('/docs/doc-1');
        expect(docsSitemap[1].pagePath).toEqual('/docs/doc-2');

        // nested docs
        expect(docsSitemap[2].children[0].pagePath).toEqual(
          '/docs/doc-3/doc-3-1',
        );
        expect(docsSitemap[2].children[1].children[0].pagePath).toEqual(
          '/docs/doc-3/doc-3-2/doc-3-2-1',
        );
      });
    });
  });

  describe('meta data generation', () => {
    let metaDataInfo;
    beforeAll(() => {
      metaDataInfo = sitemap.metaData;
    });

    it('gets specified metadata values for each of the packages', () => {
      expect(metaDataInfo[0].id).toEqual('mock-package1');
      expect(metaDataInfo[1].id).toEqual('mock-package2');
      expect(metaDataInfo[2].id).toEqual('mock-package3');
    });
  });
});

describe('File modification tests', () => {
  let packagesPath;
  let docsPath;
  let pagesPath;
  let componentsPath;
  let bundlesPath;

  beforeEach(async () => {
    const packagesCwd = await copyFixtureIntoTempDir(
      __dirname,
      'simple-mock-packages',
    );
    const docsCwd = await copyFixtureIntoTempDir(__dirname, 'simple-mock-docs');

    mockModuleBuilder(packagesCwd);

    packagesPath = path.join(packagesCwd, 'packages');
    docsPath = path.join(docsCwd, 'docs');
    pagesPath = await createTempDir();
    componentsPath = await createTempDir();
    bundlesPath = await createTempDir();
  });

  it('should remove files from package docs pages that are removed from disc on rerun', async () => {
    const firstDocsPage = path.join(
      pagesPath,
      'packages',
      'mock-package1',
      'docs',
      'extended-info.js',
    );
    await generatePages(
      [path.join(packagesPath, '/*')],
      docsPath,
      pagesPath,
      componentsPath,
      bundlesPath,
    );

    expect(fs.existsSync(firstDocsPage)).toEqual(true);

    fs.unlinkSync(
      path.join(packagesPath, 'mock-package1', 'docs', 'extended-info.md'),
    );
    await generatePages(
      [path.join(packagesPath, '/*')],
      docsPath,
      pagesPath,
      componentsPath,
      bundlesPath,
    );

    expect(fs.existsSync(firstDocsPage)).toEqual(false);
  });

  it('should remove files from docs pages that are removed from disc on rerun', async () => {
    const firstDocsPage = path.join(pagesPath, 'docs', 'doc-1.js');
    await generatePages(
      packagesPath,
      docsPath,
      pagesPath,
      componentsPath,
      bundlesPath,
    );
    expect(fs.existsSync(firstDocsPage)).toEqual(true);

    fs.unlinkSync(path.join(docsPath, 'doc-1.md'));
    await generatePages(
      [path.join(packagesPath, '/*')],
      docsPath,
      pagesPath,
      bundlesPath,
      componentsPath,
    );

    expect(fs.existsSync(firstDocsPage)).toEqual(false);
  });
});
