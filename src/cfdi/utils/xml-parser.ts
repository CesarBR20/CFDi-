import * as xml2js from 'xml2js';

export async function parseCFDI(xml: string) {
  try {
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xml);

    if (!result || !result['cfdi:Comprobante']) {
      throw new Error('Formato de CFDI inválido');
    }

    const cfdi = result['cfdi:Comprobante'];
    const emisor = cfdi['cfdi:Emisor']?.$ || {};
    const receptor = cfdi['cfdi:Receptor']?.$ || {};
    let conceptos = cfdi['cfdi:Conceptos']?.['cfdi:Concepto'];

    if (!conceptos) {
      throw new Error('El CFDI no contiene conceptos');
    }

    // Asegurar que `conceptos` siempre sea un array
    if (!Array.isArray(conceptos)) {
      conceptos = [conceptos];
    }

    return conceptos.map(concepto => ({
      emisorRfc: emisor.Rfc || 'N/A',
      emisorNombre: emisor.Nombre || 'N/A',
      receptorRfc: receptor.Rfc || 'N/A',
      receptorNombre: receptor.Nombre || 'N/A',
      claveProdServ: concepto.$?.ClaveProdServ || 'N/A',
      moneda: cfdi.$?.Moneda || 'N/A',
      monto: parseFloat(cfdi.$?.Total) || 0,
    }));
  } catch (error) {
    console.error('Error al parsear el CFDI:', error.message);
    throw new Error('Error al procesar el XML del CFDI');
  }
}
