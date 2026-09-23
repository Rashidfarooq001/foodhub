with open('apps/hotel-dashboard/src/app/orders/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_end = '''          </table>
        </div>
      </div>

      {/* RIDER SELECTION MODAL */}'''
new_end = '''          </table>
        </div>
      </div>
      </>
      )}

      {/* RIDER SELECTION MODAL */}'''

content = content.replace(old_end, new_end)

with open('apps/hotel-dashboard/src/app/orders/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
