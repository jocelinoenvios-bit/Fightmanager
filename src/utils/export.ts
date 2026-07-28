import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

export async function exportCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (value: string | number) => {
    const str = String(value ?? '');
    return /[",\n;]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const content = [headers, ...rows].map((row) => row.map(escape).join(';')).join('\n');
  const uri = `${FileSystem.cacheDirectory}${filename}.csv`;
  await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.UTF8 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: filename });
  }
}

export async function exportPdf(title: string, html: string) {
  const { uri } = await Print.printToFileAsync({
    html: `
      <html>
        <head><meta charset="utf-8" /></head>
        <body style="font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 24px; color: #0F172A;">
          <h2 style="margin-bottom: 4px;">${title}</h2>
          <p style="color:#64748B; font-size: 12px; margin-top:0;">Gerado em ${new Date().toLocaleString('pt-BR')}</p>
          ${html}
        </body>
      </html>
    `,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: title });
  }
}
