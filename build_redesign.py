# -*- coding: utf-8 -*-
"""
LOUMOO FRONTEND BUILD ORCHESTRATOR

Assembles the pristine, production-grade Commerce App.dc.html (plus its route-level
*Screens.dc.html chunks and public/) from the domain modules under src/. This file only
sequences the build; every piece of application logic, markup and styling lives in
src/<domain>/ and is composed by the helpers in src/core/build/.

See docs/FRONTEND_ARCHITECTURE.md for the module layout.
"""

import os
import sys

sys.path.append(os.path.abspath('.'))

from src.core.build import catalog_assets, chunks, component, public_site, registry, screens, shell, styles


def build():
    # The catalogue bundle is emitted first: the shell loads it and the views read it.
    catalog_assets.emit_catalog_assets()

    lazy_markup = chunks.write_lazy_chunks(screens.screen_chunks())

    header = shell.document_header(styles.master_stylesheet())
    footer = shell.document_footer(component.assemble_component_script(registry.COMPONENT_DOMAINS))

    full_html = (
        chunks.optimize_media_markup(header)
        + chunks.optimize_media_markup(screens.home_markup())
        + lazy_markup
        + chunks.optimize_media_markup(footer)
    )
    with open('Commerce App.dc.html', 'w', encoding='utf-8') as handle:
        handle.write(full_html)

    public_site.assemble_public()
    print("Commerce App.dc.html successfully rebuilt with all screens and backend integration!")


if __name__ == '__main__':
    build()
