import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const generateEpub = async () => {
    const zip = new JSZip();

    // 1. mimetype
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

    // 2. META-INF/container.xml
    zip.file('META-INF/container.xml', `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
        <rootfile full-path="content.opf" media-type="application/oebps-package+xml"/>
    </rootfiles>
</container>`);

    // 3. content.opf
    const opfContent = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
        <dc:title>Short Test Book</dc:title>
        <dc:creator opf:role="aut">Test Author</dc:creator>
        <dc:language>en</dc:language>
        <meta name="cover" content="cover-image" />
    </metadata>
    <manifest>
        <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
        <item id="style" href="style.css" media-type="text/css"/>
        <item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>
        <item id="chap1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
        <item id="chap2" href="chapter2.xhtml" media-type="application/xhtml+xml"/>
    </manifest>
    <spine toc="ncx">
        <itemref idref="cover"/>
        <itemref idref="chap1"/>
        <itemref idref="chap2"/>
    </spine>
</package>`;
    zip.file('content.opf', opfContent);

    // 4. toc.ncx
    const ncxContent = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
    <head>
        <meta name="dtb:uid" content="urn:uuid:12345"/>
        <meta name="dtb:depth" content="1"/>
        <meta name="dtb:totalPageCount" content="0"/>
        <meta name="dtb:maxPageNumber" content="0"/>
    </head>
    <docTitle><text>Short Test Book</text></docTitle>
    <navMap>
        <navPoint id="navPoint-1" playOrder="1">
            <navLabel><text>Cover</text></navLabel>
            <content src="cover.xhtml"/>
        </navPoint>
        <navPoint id="navPoint-2" playOrder="2">
            <navLabel><text>Chapter 1: The Beginning</text></navLabel>
            <content src="chapter1.xhtml"/>
        </navPoint>
        <navPoint id="navPoint-3" playOrder="3">
            <navLabel><text>Chapter 2: The Complexity</text></navLabel>
            <content src="chapter2.xhtml"/>
        </navPoint>
    </navMap>
</ncx>`;
    zip.file('toc.ncx', ncxContent);

    // 5. Content Files
    zip.file('style.css', `body { font-family: serif; } h1 { color: #333; }`);

    zip.file('cover.xhtml', `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Cover</title><link rel="stylesheet" href="style.css" type="text/css"/></head>
<body>
    <h1>Short Test Book</h1>
    <h3>By Test Author</h3>
</body>
</html>`);

    zip.file('chapter1.xhtml', `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Chapter 1</title><link rel="stylesheet" href="style.css" type="text/css"/></head>
<body>
    <h1>Chapter 1: The Beginning</h1>
    <p>This is a simple sentence. It is easy to read. The cat sat on the mat.</p>
    <p>Here is another paragraph. It has a few more words, but it is still quite simple. We are testing the ingestion pipeline.</p>
</body>
</html>`);

    zip.file('chapter2.xhtml', `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Chapter 2</title><link rel="stylesheet" href="style.css" type="text/css"/></head>
<body>
    <h1>Chapter 2: The Complexity</h1>
    <p>The dialectical materialism of the situation presents itself as a complex accumulation of contradictions. However, the synthesis of these opposing forces results in a new paradigm of understanding.</p>
    <p>This sentence is long, winding, and full of commas, which should trigger the structural rhythm detection code to slow down the reading speed significantly.</p>
</body>
</html>`);

    // Generate
    const content = await zip.generateAsync({ type: 'nodebuffer' });
    const outputPath = path.join(__dirname, '../test_book.epub');
    fs.writeFileSync(outputPath, content);
    console.log(`Created test_book.epub at ${outputPath}`);
};

generateEpub().catch(console.error);
