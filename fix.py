with open('src/pages/SummaryReports.tsx', 'r') as f:
    content = f.read()

# The missing closing tags need to be inserted right before <style>
style_idx = content.find('      <style>{`')
if style_idx != -1:
    content = content[:style_idx] + '          </div>\n        </div>\n      </div>\n' + content[style_idx:]
    with open('src/pages/SummaryReports.tsx', 'w') as f:
        f.write(content)
        print("fixed")
