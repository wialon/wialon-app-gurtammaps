# Third-party notices

This repository is distributed under the MIT License (see `LICENSE-MIT`). That licence applies to the code written by Gurtam. The components listed below are third-party software included in the repository; they remain under their own licences, which are named in each entry and reproduced at the end of this file.

## Third-party components

### jQuery 1.8.3

- Where: `js/jquery-1.8.3.min.js`
- Project: https://jquery.com/
- Licence: MIT License (SPDX: MIT). Text: see "MIT License" below.
- Copyright notice: Copyright 2012 jQuery Foundation and other contributors, http://jquery.com/

### jQuery UI 1.11.2

- Where: `js/jquery-ui.js`; `css/jquery-ui-1.10.0.custom.min.css` (theme stylesheet of version 1.10.0); `css/images/` (theme images)
- Project: http://jqueryui.com
- Licence: MIT License (SPDX: MIT). Text: see "MIT License" below.
- Copyright notice: Copyright 2014 jQuery Foundation and other contributors

### Localisation assistance for jQuery 1.1.0 (jquery.localisation)

- Where: `js/jquery.localisation.js`
- Project: http://keith-wood.name/localisation.html
- Licence: dual-licensed by its author under the MIT License or the GPL; used here under the MIT License (SPDX: MIT). Text: see "MIT License" below.
- Copyright notice: Written by Keith Wood (kbwood{at}iinet.com.au) June 2007.
- Note: Modified by Gurtam: the plugin loads the translations as JSON files (`<package>-<lang>.json`) into a global `TRANSLATIONS` object instead of loading scripts.

### jquery.nicescroll 3.6.0

- Where: `js/jquery.nicescroll.min.js`
- Project: http://nicescroll.areaaperta.com (https://github.com/inuyaksa/jquery.nicescroll)
- Licence: MIT License (SPDX: MIT). Text: see "MIT License" below.
- Copyright notice: copyright 2014-11-21 InuYaksa*2014

### Placeholder plugin for jQuery

- Where: `js/jquery.placeholder.min.js`
- Project: http://webcloud.se
- Licence: released by its author under the MIT, BSD and GPL licences; used here under the MIT License (SPDX: MIT). Text: see "MIT License" below.
- Copyright notice: Copyright 2010, Daniel Stocks (http://webcloud.se)
- Note: The version is not stated in the file.

### jQuery UI Touch Punch 0.2.3

- Where: `js/jquery.ui.touch-punch.ext.js`
- Project: https://github.com/furf/jquery-ui-touch-punch
- Licence: dual-licensed by its author under the MIT License or the GPL Version 2; used here under the MIT License (SPDX: MIT). Text: see "MIT License" below.
- Copyright notice: Copyright 2011–2014, Dave Furfero
- Note: Modified by Gurtam: the file is the source of Touch Punch 0.2.3 with its header comment removed and a 500 ms timer added to the touch handlers (`_timeout`). The copyright line reproduced here is the one of the original header.

### Leaflet 0.7.3

- Where: `js/leaflet.js`; `css/leaflet.css`; `js/images/layers.png`, layers-2x.png, marker-icon-2x.png, marker-shadow.png and img/marker-shadow.png (images of the Leaflet distribution)
- Project: http://leafletjs.com
- Licence: BSD 2-Clause License (SPDX: BSD-2-Clause). Text: see "BSD 2-Clause License (Leaflet)" below.
- Copyright notices:
  - Copyright (c) 2010-2013, Vladimir Agafonkin
  - Copyright (c) 2010-2011, CloudMade
  - All rights reserved.
- Note: `js/leaflet.js` is identical to the 0.7.3 release. `css/leaflet.css` differs from the stylesheet of the 0.7.3 release (modified by Gurtam: the z-index of the control containers is lowered).

### NProgress 0.1.6

- Where: `js/nprogress.js`; `css/nprogress.css`
- Project: http://ricostacruz.com/nprogress
- Licence: MIT License (SPDX: MIT). Text: see "MIT License" below.
- Copyright notice: Copyright (c) 2013-2014 Rico Sta. Cruz

### FileSaver.js (version dated 2015-03-04)

- Where: `js/FileSaver.min.js`
- Project: https://github.com/eligrey/FileSaver.js
- Licence: MIT License, called "X11/MIT" by the author (SPDX: MIT). Text: see "MIT License" below.
- Copyright notice: Copyright © 2015 Eli Grey (http://eligrey.com)
- Note: The minified file states only its source URL; it is byte-identical to `FileSaver.min.js` of the project as of the version dated 2015-03-04.

### Underscore.js 1.7.0

- Where: `js/underscore-min.js`
- Project: http://underscorejs.org
- Licence: MIT License (SPDX: MIT). Text: see "MIT License" below.
- Copyright notice: Copyright (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
- Note: Modified by Gurtam: the `sourceMappingURL` comment at the end of the file was removed.

## Licence texts

### MIT License

The following text applies to every component above that refers to the MIT License; the copyright notice of each component is given in its entry.

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### BSD 2-Clause License (Leaflet)

```
Copyright (c) 2010-2013, Vladimir Agafonkin
Copyright (c) 2010-2011, CloudMade
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are
permitted provided that the following conditions are met:

   1. Redistributions of source code must retain the above copyright notice, this list of
      conditions and the following disclaimer.

   2. Redistributions in binary form must reproduce the above copyright notice, this list
      of conditions and the following disclaimer in the documentation and/or other materials
      provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

## Libraries loaded at run time

At run time the app also loads some libraries from the network (for example the Wialon JavaScript SDK). They are not part of this repository and are not covered by this file.
