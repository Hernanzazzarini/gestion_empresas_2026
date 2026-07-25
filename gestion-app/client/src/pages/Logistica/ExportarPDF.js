import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const COLOR = {
  negro:      [15,  17,  23],
  superficie: [24,  28,  39],
  borde:      [42,  48,  69],
  acento:     [245, 158, 11],
  azul:       [59,  130, 246],
  verde:      [16,  185, 129],
  rojo:       [239, 68,  68],
  purpura:    [168, 85,  247],
  gris:       [100, 116, 139],
  blanco:     [241, 245, 249],
}

const siNo = (val) => {
  if (val === 'na')               return 'N/A'
  if (val === 1 || val === true)  return 'SI'
  if (val === 0 || val === false) return 'NO'
  return '—'
}

const val = (v) => {
  if (v === null || v === undefined || v === '') return '—'
  return String(v)
}

const fecha = (v) => {
  if (!v) return '—'
  return new Date(v).toLocaleDateString('es-AR')
}

const temp = (v) => {
  if (!v && v !== 0) return '—'
  return `${v} °C`
}

export const exportarContenedorPDF = (data) => {  // ← ya no es async
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const s1  = data.seccion1 || {}
  const s2  = data.seccion2 || {}
  const W   = doc.internal.pageSize.getWidth()
  const H   = doc.internal.pageSize.getHeight()
  let y     = 0

  const fondo = () => {
    doc.setFillColor(...COLOR.negro)
    doc.rect(0, 0, W, H, 'F')
  }
  fondo()

  const nuevaPagina = () => {
    doc.addPage()
    fondo()
    y = 14
  }

  const checkPagina = (espacio = 30) => {
    if (y + espacio > H - 14) nuevaPagina()
  }

  const secTitulo = (titulo, color) => {
    checkPagina(16)
    doc.setFillColor(...COLOR.superficie)
    doc.roundedRect(10, y, W - 20, 8, 1, 1, 'F')
    doc.setFillColor(...color)
    doc.rect(10, y, 3, 8, 'F')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...color)
    doc.text(titulo.toUpperCase(), 17, y + 5.5)
    y += 12
  }

  const filaCampos = (campos) => {
    checkPagina(14)
    const anchoCol = (W - 20) / campos.length
    campos.forEach((c, i) => {
      const x = 10 + i * anchoCol
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLOR.gris)
      doc.text(c.label.toUpperCase(), x, y)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLOR.blanco)
      doc.text(val(c.val), x, y + 4.5, { maxWidth: anchoCol - 4 })
    })
    y += 13
  }

  const tablaItems = (items, startY) => {
    autoTable(doc, {
      startY,
      head: [['ÍTEM', 'RESULTADO']],
      body: items,
      theme: 'plain',
      styles: {
        fillColor:   COLOR.superficie,
        textColor:   COLOR.blanco,
        fontSize:    8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor:  COLOR.borde,
        textColor:  COLOR.acento,
        fontStyle:  'bold',
        fontSize:   8,
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 1) {
          if (data.cell.raw === 'SI')  data.cell.styles.textColor = COLOR.verde
          if (data.cell.raw === 'NO')  data.cell.styles.textColor = COLOR.rojo
          if (data.cell.raw === 'N/A') data.cell.styles.textColor = COLOR.gris
        }
      },
      margin: { left: 10, right: 10 },
    })
    return doc.lastAutoTable.finalY + 6
  }

  // ── ENCABEZADO ───────────────────────────────────────────────────────────────
  doc.setFillColor(...COLOR.superficie)
  doc.rect(0, 0, W, 30, 'F')
  doc.setFillColor(...COLOR.acento)
  doc.rect(0, 0, 4, 30, 'F')
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLOR.acento)
  doc.text('BUENAS PRÁCTICAS DE MANUFACTURA', 12, 10)
  doc.setFontSize(10)
  doc.setTextColor(...COLOR.blanco)
  doc.text('FORMULARIO DE CARGA DE CONTENEDOR', 12, 17)
  doc.setFontSize(8)
  doc.setTextColor(...COLOR.gris)
  doc.text('V Fo Ex Lo 06  —  Rev: 08  —  Vig: 27/06/2025', 12, 24)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLOR.acento)
  doc.text(val(data.registro_nro), W - 12, 13, { align: 'right' })
  doc.setFontSize(7)
  doc.setTextColor(...COLOR.gris)
  doc.text('N° REGISTRO', W - 12, 20, { align: 'right' })

  y = 36

  // ── SECCIÓN 1 ────────────────────────────────────────────────────────────────
  secTitulo('Sección 1 — Inspección de Inocuidad', COLOR.verde)
  filaCampos([
    { label: 'Fecha',          val: fecha(data.fecha)    },
    { label: 'Orden de Carga', val: data.orden_carga_nro },
    { label: 'Hora Entrada',   val: data.hora_entrada    },
  ])
  filaCampos([
    { label: 'Empresa Transportista', val: data.empresa_transportista },
    { label: 'Chofer',                val: data.chofer                },
  ])
  filaCampos([
    { label: 'Patente Tractor', val: data.patente_tractor },
    { label: 'Patente Semi',    val: data.patente_semi    },
    { label: 'Nº Contenedor',   val: data.nro_contenedor  },
  ])

  checkPagina(80)
  secTitulo('Control Antes de la Carga', COLOR.azul)
  y = tablaItems([
    ['Pestillos de cierre de puertas',       siNo(s1.pestillos_cierre)      ],
    ['Contenedor seco',                      siNo(s1.contenedor_seco)       ],
    ['Contenedor sin olor',                  siNo(s1.contenedor_sin_olor)   ],
    ['Ausencia de materiales contaminantes', siNo(s1.ausencia_contaminantes)],
    ['Contenedor limpio (paredes)',          siNo(s1.limpio_paredes)        ],
    ['Contenedor limpio (piso)',             siNo(s1.limpio_piso)           ],
    ['Contenedor limpio (techo)',            siNo(s1.limpio_techo)          ],
    ['Contenedor limpio (puertas)',          siNo(s1.limpio_puertas)        ],
    ['Paredes en buen estado',               siNo(s1.paredes_buen_estado)   ],
    ['Piso en buen estado',                  siNo(s1.piso_buen_estado)      ],
    ['Techo en buen estado',                 siNo(s1.techo_buen_estado)     ],
    ['Puertas en buen estado',               siNo(s1.puertas_buen_estado)   ],
  ], y)

  if (s1.observacion_control) {
    checkPagina(16)
    doc.setFontSize(7)
    doc.setTextColor(...COLOR.gris)
    doc.text('OBSERVACIONES:', 10, y)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLOR.blanco)
    doc.text(s1.observacion_control, 10, y + 4, { maxWidth: W - 20 })
    y += 14
  }

  checkPagina(22)
  secTitulo('Resultado de Inspección', COLOR.verde)
  const aptoColor = s1.apto_para_cargar ? COLOR.verde : COLOR.rojo
  const aptoTexto = s1.apto_para_cargar ? '✓  APTO PARA CARGAR' : '✗  NO APTO PARA CARGAR'
  doc.setFillColor(...aptoColor)
  doc.roundedRect(10, y, W - 20, 11, 2, 2, 'F')
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLOR.negro)
  doc.text(aptoTexto, W / 2, y + 7.5, { align: 'center' })
  y += 15
  filaCampos([{ label: 'Responsable Inocuidad', val: s1.responsable_inocuidad }])

  // ── SECCIÓN 2 ────────────────────────────────────────────────────────────────
  checkPagina(20)
  y += 4
  secTitulo('Sección 2 — Control de Carga (Logística)', COLOR.acento)
  filaCampos([
    { label: 'Hora Salida',      val: s2.hora_salida      },
    { label: 'Destino Descarga', val: s2.destino_descarga },
    { label: 'Cosecha',          val: s2.cosecha          },
    { label: 'Tipo de Envase',   val: s2.tipo_envase      },
  ])

  checkPagina(80)
  secTitulo('Control Después de la Carga', COLOR.azul)
  y = tablaItems([
    ['Forrado de contenedor',                          siNo(s2.forrado_contenedor)             ],
    ['Material de forrado',                            val(s2.material_forrado)                ],
    ['Envases en perfecto estado',                     siNo(s2.envases_buen_estado)            ],
    ['Envases perfectamente colocados',                siNo(s2.envases_bien_colocados)         ],
    ['Envases correctamente cerrados',                 siNo(s2.envases_correctamente_cerrados) ],
    ['Envases con identificación de expedición',       siNo(s2.envases_identificacion)         ],
    ['Faja de trincado correctamente colocada',        siNo(s2.faja_trincado)                  ],
    ['Evidencia de insectos',                          siNo(s2.evidencia_insectos)             ],
    ['Sales o geles absorbentes',                      siNo(s2.sales_geles)                    ],
    [`  Cantidad: ${val(s2.sales_cantidad)} uds  —  Lote: ${val(s2.sales_lote)}`, ''],
    [`  Tamaño: ${val(s2.sales_tipo_gel)}g  —  Absorción: ${
      s2.sales_cantidad && s2.sales_tipo_gel
        ? (parseInt(s2.sales_cantidad) * (
            s2.sales_tipo_gel == 1000 ? 3.6 :
            s2.sales_tipo_gel == 1500 ? 5.4 : 7.2
          )).toFixed(1) + ' litros' : '—'
    }`, ''],
    ['Blíster con fosfuro',                            siNo(s2.blister_fosfuro)                ],
    [`  Cantidad: ${val(s2.blister_cantidad)}  —  Lote: ${val(s2.blister_lote)}`, ''],
    ['Pallet expo',                                    siNo(s2.pallet_expo)                    ],
    [`  Cantidad: ${val(s2.pallet_cantidad)}  —  Lote: ${val(s2.pallet_lote)}`, ''],
  ], y)

  checkPagina(28)
  secTitulo('Datos del Lote', COLOR.purpura)
  filaCampos([
    { label: 'Lote',      val: s2.lote             },
    { label: 'Nº BLS/BB', val: s2.nro_bls_bb       },
    { label: 'Calibre',   val: s2.calibre           },
    { label: 'Fumigado',  val: siNo(s2.va_fumigado) },
  ])

  checkPagina(28)
  secTitulo('Temperatura Final del Lote', COLOR.azul)
  filaCampos([
    { label: 'BB N°1',  val: temp(s2.temp_bb1)  },
    { label: 'BB N°5',  val: temp(s2.temp_bb5)  },
    { label: 'BB N°10', val: temp(s2.temp_bb10) },
    { label: 'BB N°15', val: temp(s2.temp_bb15) },
    { label: 'BB N°20', val: temp(s2.temp_bb20) },
  ])

  if (s2.temp_promedio) {
    checkPagina(14)
    doc.setFillColor(...COLOR.azul)
    doc.roundedRect(10, y - 4, W - 20, 10, 2, 2, 'F')
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLOR.negro)
    doc.text(`PROMEDIO: ${s2.temp_promedio} °C`, W / 2, y + 2.5, { align: 'center' })
    y += 12
  }

  checkPagina(60)
  secTitulo('Control de Etiquetas', COLOR.acento)
  y = tablaItems([
    ['Lote',                          siNo(s2.etiqueta_lote)    ],
    ['Calibre',                       siNo(s2.etiqueta_calibre) ],
    ['Peso',                          siNo(s2.etiqueta_peso)    ],
    ['Fechas Producción/Vencimiento', siNo(s2.etiqueta_fechas)  ],
    ['Leyenda',                       siNo(s2.etiqueta_leyenda) ],
    ['Etiquetas Especial',            siNo(s2.etiqueta_especial)],
  ], y)

  checkPagina(30)
  secTitulo('Control de Elementos', COLOR.acento)
  y = tablaItems([
    ['Carga libre de cuerpos extraños', siNo(s2.carga_libre_cuerpos_extranos)],
  ], y)

  if (s2.obs_control_elementos) {
    checkPagina(16)
    doc.setFontSize(7)
    doc.setTextColor(...COLOR.gris)
    doc.text('OBSERVACIONES:', 10, y)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLOR.blanco)
    doc.text(s2.obs_control_elementos, 10, y + 4, { maxWidth: W - 20 })
    y += 14
  }

  checkPagina(28)
  secTitulo('Control del Estado del Tiempo', COLOR.azul)
  filaCampos([
    { label: 'Punto de Rocío',  val: temp(s2.punto_rocio)                                     },
    { label: 'Temp. Tempering', val: temp(s2.temp_tempering)                                   },
    { label: 'Hum. Tempering',  val: s2.humedad_tempering ? `${s2.humedad_tempering}%` : '—'  },
    { label: 'Temp. Ambiente',  val: temp(s2.temp_ambiente)                                    },
    { label: 'Hum. Ambiente',   val: s2.humedad_ambiente  ? `${s2.humedad_ambiente}%`  : '—'  },
  ])

  if (s2.obs_etiquetas) {
    checkPagina(16)
    doc.setFontSize(7)
    doc.setTextColor(...COLOR.gris)
    doc.text('OBSERVACIONES ETIQUETAS:', 10, y)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLOR.blanco)
    doc.text(s2.obs_etiquetas, 10, y + 4, { maxWidth: W - 20 })
    y += 14
  }

  // ── FOTOS ────────────────────────────────────────────────────────────────────
  const fotos = ['foto1', 'foto2', 'foto3', 'foto4']
    .map(k => s2[k])
    .filter(Boolean)

  if (fotos.length > 0) {
    checkPagina(20)
    secTitulo('Fotos del Contenedor Cargado', COLOR.verde)

    const anchoFoto = (W - 26) / 2
    const altoFoto  = anchoFoto * 0.75

    fotos.forEach((base64, i) => {
      const col = i % 2
      const x   = 10 + col * (anchoFoto + 6)

      if (col === 0 && i > 0) {
        y += altoFoto + 8
      }

      checkPagina(altoFoto + 14)

      if (base64) {
        // Marco
        doc.setFillColor(...COLOR.superficie)
        doc.roundedRect(x - 1, y - 1, anchoFoto + 2, altoFoto + 2, 2, 2, 'F')
        // Imagen
        doc.addImage(base64, 'JPEG', x, y, anchoFoto, altoFoto)
        // Etiqueta
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLOR.gris)
        doc.text(`Foto ${i + 1}`, x + 2, y + altoFoto - 2)
      } else {
        doc.setFillColor(...COLOR.superficie)
        doc.roundedRect(x, y, anchoFoto, altoFoto, 2, 2, 'F')
        doc.setFontSize(9)
        doc.setTextColor(...COLOR.gris)
        doc.text(`Foto ${i + 1} — sin imagen`, x + anchoFoto / 2, y + altoFoto / 2, { align: 'center' })
      }
    })

    y += altoFoto + 12
  }

  // ── FIRMAS ───────────────────────────────────────────────────────────────────
  checkPagina(28)
  secTitulo('Firmas', COLOR.purpura)
  filaCampos([
    { label: 'Firma del Cargador',       val: s2.firma_cargador       },
    { label: 'Firma del Auxiliar',       val: s2.firma_auxiliar       },
    { label: 'Firma del Acondicionador', val: s2.firma_acondicionador },
  ])

  // ── PIE DE PÁGINA ─────────────────────────────────────────────────────────────
  const totalPaginas = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i)
    doc.setFillColor(...COLOR.superficie)
    doc.rect(0, H - 10, W, 10, 'F')
    doc.setFontSize(7)
    doc.setTextColor(...COLOR.gris)
    doc.text(
      `GestiónPro  —  Control de Contenedores  —  ${val(data.registro_nro)}  —  Contenedor: ${val(data.nro_contenedor)}`,
      10, H - 4
    )
    doc.text(`Página ${i} de ${totalPaginas}`, W - 10, H - 4, { align: 'right' })
  }

  doc.save(`${val(data.registro_nro)}_${val(data.nro_contenedor)}.pdf`)
}