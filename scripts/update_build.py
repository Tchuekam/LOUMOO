with open('build_redesign.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import
if 'public_profile_view' not in content:
    import_line = 'from src.views.listing_creation_view import get_listing_creation_view\nfrom src.views.public_profile_view import get_public_profile_view'
    content = content.replace('from src.views.listing_creation_view import get_listing_creation_view', import_line)

# 2. Add navColor entries
content = content.replace("this.navColor('store', 'business')", "this.navColor('store', 'business', 'sellerPublicPage')")
content = content.replace("'userActivity', 'signIn'", "'userActivity', 'publicUserProfile', 'signIn'")

# 3. Add to full_html
if 'get_public_profile_view()' not in content:
    assembly_target = '+ get_listing_creation_view()\n    + get_public_profile_view()'
    content = content.replace('+ get_listing_creation_view()', assembly_target)

with open('build_redesign.py', 'w', encoding='utf-8') as f:
    f.write(content)

print('build_redesign.py successfully updated with public profile view!')