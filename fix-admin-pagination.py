import sys
with open('apps/admin-dashboard/src/app/orders/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_footer = '''              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}'''

new_footer = '''              </table>
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-4 pb-2 border-t border-gray-100">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs font-bold text-gray-400">Page {page}</span>
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={filtered.length < 20}
                className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            
          </>
        )}
      </div>
    </div>
  );
}'''
content = content.replace(old_footer, new_footer)

with open('apps/admin-dashboard/src/app/orders/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
