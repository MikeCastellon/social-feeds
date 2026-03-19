const { getAdminClient } = require('../../src/lib/supabaseAdmin');

async function getWidgetConfig(widgetKey) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('widget_configs')
    .select('*')
    .eq('widget_key', widgetKey)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw new Error(error.message);
  }
  return data;
}

module.exports = { getWidgetConfig };
