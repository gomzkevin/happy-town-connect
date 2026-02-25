import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Row,
  Column,
  Img,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface QuoteEmailCompleteProps {
  customerName: string
  email: string
  phone?: string
  eventDate?: string
  childrenCount?: number
  location?: string
  companyName: string
  companyEmail: string
  companyPhone?: string
  companyAddress?: string
  logoUrl?: string
  services: Array<{
    name: string
    price: number
    quantity: number
    category?: string
  }>
  totalEstimate: number
  termsConditions?: string
  quoteNumber: string
  createdDate: string
}

const ASSETS_BASE = 'https://hnkkgjmudteyzzfbogto.supabase.co/storage/v1/object/public/japitown-assets'

function getCategoryBadge(category?: string): { label: string; bg: string; color: string } {
  if (!category) return { label: '', bg: 'transparent', color: '#555250' }
  const cat = category.toLowerCase()
  if (cat.includes('taller') || cat.includes('creativ'))
    return { label: '🎨 Taller', bg: '#e8f5e0', color: '#4a8a3a' }
  if (cat.includes('estacion') || cat.includes('juego'))
    return { label: '🏠 Estación', bg: '#ddeefb', color: '#3a6e9c' }
  return { label: '⭐ Servicio', bg: '#f3ece5', color: '#555250' }
}

export const QuoteEmailComplete = ({
  customerName,
  email,
  phone,
  eventDate,
  childrenCount,
  location,
  companyName,
  companyEmail,
  companyPhone,
  companyAddress,
  logoUrl,
  services,
  totalEstimate,
  termsConditions,
  quoteNumber,
  createdDate,
}: QuoteEmailCompleteProps) => (
  <Html>
    <Head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Quicksand:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; color-adjust: exact; }
          .no-print { display: none !important; }
          .print-friendly { page-break-inside: avoid; }
        }
      `}</style>
    </Head>
    <Preview>Tu cotización #{quoteNumber} de {companyName} está lista 🎉</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header with logo on cream background */}
        <Section style={header}>
          <Img
            src={`${ASSETS_BASE}/icons/Iconos-17.png`}
            alt=""
            width="28"
            height="28"
            style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}
          />
          <Img
            src={`${ASSETS_BASE}/icons/Iconos-15.png`}
            alt=""
            width="28"
            height="28"
            style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '8px' }}
          />
          <Img
            src={`${ASSETS_BASE}/logos/Logo-21.png`}
            alt={`${companyName} Logo`}
            width="180"
            height="auto"
            style={{
              display: 'block',
              marginLeft: 'auto',
              marginRight: 'auto',
              marginTop: '12px',
              marginBottom: '8px',
            }}
          />
          <Text style={subtitle}>Eventos Infantiles</Text>
        </Section>

        {/* Rainbow stripe */}
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ borderCollapse: 'collapse' }}>
          <tr>
            {['#e95e3d','#f2ae75','#f6cc38','#84bc70','#6aa3cd','#937ac4','#e9987e'].map((c, i) => (
              <td key={i} style={{ height: '5px', backgroundColor: c, width: '14.28%' }} />
            ))}
          </tr>
        </table>

        {/* Quote Info Bar */}
        <Section style={quoteInfoBar}>
          <Row>
            <Column style={leftCol}>
              <Text style={quoteNumStyle}>Cotización #{quoteNumber}</Text>
              <Text style={quoteDateStyle}>Fecha: {createdDate}</Text>
            </Column>
            <Column style={rightCol}>
              <Text style={customerInfoStyle}>
                <strong>Para:</strong> {customerName}
              </Text>
              <Text style={customerInfoStyle}>{email}</Text>
              {phone && <Text style={customerInfoStyle}>{phone}</Text>}
            </Column>
          </Row>
        </Section>

        {/* Welcome */}
        <Section style={welcomeSection}>
          <Heading style={h2}>¡Hola {customerName}! 🎉</Heading>
          <Text style={text}>
            Gracias por tu interés en <strong>Japitown</strong>. Hemos preparado una cotización personalizada para tu evento.
          </Text>
          {services.length > 0 && (
            <Text style={{ ...text, color: '#a68bea', fontWeight: '600' }}>
              📎 Adjuntamos tu cotización en PDF para que la conserves.
            </Text>
          )}
        </Section>

        {/* Client & Event Details */}
        <Section style={section}>
          <Row>
            <Column style={detailColumn}>
              <Heading style={h3}>👤 Datos del Cliente</Heading>
              <Text style={detailText}><strong>Nombre:</strong> {customerName}</Text>
              <Text style={detailText}><strong>Email:</strong> {email}</Text>
              {phone && <Text style={detailText}><strong>Teléfono:</strong> {phone}</Text>}
            </Column>
            <Column style={detailColumn}>
              <Heading style={h3}>📅 Datos del Evento</Heading>
              {eventDate && <Text style={detailText}><strong>Fecha:</strong> {eventDate}</Text>}
              {childrenCount && <Text style={detailText}><strong>Niños:</strong> {childrenCount}</Text>}
              {location && <Text style={detailText}><strong>Ubicación:</strong> {location}</Text>}
            </Column>
          </Row>
        </Section>

        {/* Services Table */}
        <Section style={section} className="print-friendly">
          <Heading style={h2}>🎪 Servicios Cotizados</Heading>
          <table style={servicesTable}>
            <thead>
              <tr style={tableHeader}>
                <th style={tableHeaderCell}>Servicio</th>
                <th style={{ ...tableHeaderCell, textAlign: 'center' }}>Cant.</th>
                <th style={{ ...tableHeaderCell, textAlign: 'right' }}>Precio Unit.</th>
                <th style={{ ...tableHeaderCell, textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service, index) => {
                const badge = getCategoryBadge(service.category)
                return (
                  <tr key={index} style={tableRow}>
                    <td style={tableCell}>
                      {service.name}
                      {badge.label && (
                        <span style={{
                          display: 'inline-block',
                          marginLeft: '8px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: '600',
                          backgroundColor: badge.bg,
                          color: badge.color,
                          fontFamily: fontBody,
                        }}>
                          {badge.label}
                        </span>
                      )}
                    </td>
                    <td style={{ ...tableCell, textAlign: 'center' }}>{service.quantity}</td>
                    <td style={{ ...tableCell, textAlign: 'right' }}>${service.price.toLocaleString()}</td>
                    <td style={{ ...tableCell, textAlign: 'right', fontWeight: 'bold' }}>
                      ${(service.price * service.quantity).toLocaleString()}
                    </td>
                  </tr>
                )
              })}
              <tr style={totalRow}>
                <td style={{ ...totalCell, borderRight: 'none' }} colSpan={3}>
                  <strong>TOTAL ESTIMADO</strong>
                </td>
                <td style={{ ...totalCell, textAlign: 'right' }}>
                  <strong>${totalEstimate.toLocaleString()}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* Next Steps */}
        <Section style={section}>
          <Heading style={h2}>📞 Próximos Pasos</Heading>
          <Text style={text}>1. <strong>Revisa</strong> los detalles de tu cotización</Text>
          <Text style={text}>2. <strong>Contáctanos</strong> para confirmar tu reservación</Text>
          <Text style={text}>3. <strong>¡Disfruta</strong> de una fiesta inolvidable!</Text>
          <Text style={{ ...text, marginTop: '20px' }} className="no-print">
            💡 <em>Tip: Puedes imprimir este email o el PDF adjunto para conservar tu cotización</em>
          </Text>
        </Section>

        {/* Contact */}
        <Section style={contactSection} className="print-friendly">
          <Heading style={h2}>📞 Información de Contacto</Heading>
          <Row>
            <Column>
              <Text style={contactText}>
                <strong>Email:</strong> <Link href={`mailto:${companyEmail}`} style={{ color: '#a68bea' }}>{companyEmail}</Link>
              </Text>
              {companyPhone && <Text style={contactText}><strong>Teléfono:</strong> {companyPhone}</Text>}
            </Column>
            <Column>
              {companyAddress && <Text style={contactText}><strong>Dirección:</strong> {companyAddress}</Text>}
            </Column>
          </Row>
        </Section>

        {/* Terms */}
        {termsConditions && (
          <Section style={termsSection} className="print-friendly">
            <Heading style={h3}>📋 Términos y Condiciones</Heading>
            {termsConditions.split('\n').filter((line: string) => line.trim()).map((line: string, i: number) => {
              const processed = childrenCount
                ? line.replace(/\d+\s*niños/gi, `${childrenCount} niños`)
                : line;
              return (
                <Text key={i} style={termsText}>
                  • {processed.replace(/^[•\-\*]\s*/, '').trim()}
                </Text>
              );
            })}
          </Section>
        )}

        {/* Footer with decorative icons */}
        <Section style={footer}>
          <Row>
            <Column style={{ textAlign: 'center' }}>
              <Img src={`${ASSETS_BASE}/icons/Iconos-19.png`} alt="" width="24" height="24" style={{ display: 'inline-block', margin: '0 4px' }} />
              <Img src={`${ASSETS_BASE}/icons/Iconos-13.png`} alt="" width="24" height="24" style={{ display: 'inline-block', margin: '0 4px' }} />
              <Img src={`${ASSETS_BASE}/icons/Iconos-14.png`} alt="" width="24" height="24" style={{ display: 'inline-block', margin: '0 4px' }} />
              <Img src={`${ASSETS_BASE}/icons/Iconos-17.png`} alt="" width="24" height="24" style={{ display: 'inline-block', margin: '0 4px' }} />
              <Img src={`${ASSETS_BASE}/icons/Iconos-15.png`} alt="" width="24" height="24" style={{ display: 'inline-block', margin: '0 4px' }} />
            </Column>
          </Row>
          <Text style={footerText}>
            Esta cotización es válida por 15 días desde la fecha de emisión.
          </Text>
          <Text style={footerText}>
            ¡Gracias por confiar en {companyName} para tu evento especial! 🎉
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default QuoteEmailComplete

// ─── Typography ─────────────────────────────────────────────────
const fontHeading = "'Fredoka', 'Arial Rounded MT Bold', Arial, sans-serif"
const fontBody = "'Quicksand', 'Segoe UI', Arial, sans-serif"

// ─── Styles ─────────────────────────────────────────────────────
const main = {
  backgroundColor: '#f3ece5',
  fontFamily: fontBody,
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  marginBottom: '64px',
  maxWidth: '800px',
  borderRadius: '12px',
  overflow: 'hidden' as const,
  border: '1px solid #e8e0d8',
}

const header = {
  padding: '32px 24px 16px',
  textAlign: 'center' as const,
  backgroundColor: '#f3ece5',
}

const subtitle = {
  color: '#555250',
  fontSize: '14px',
  margin: '0',
  fontFamily: fontBody,
  fontWeight: '500',
  letterSpacing: '0.5px',
}

const quoteInfoBar = {
  padding: '16px 24px',
  backgroundColor: '#faf7f4',
  borderBottom: '3px solid #a68bea',
}

const leftCol = { width: '50%' }
const rightCol = { width: '50%', textAlign: 'right' as const }

const quoteNumStyle = {
  fontSize: '18px',
  fontWeight: 'bold' as const,
  color: '#a68bea',
  margin: '0 0 4px',
  fontFamily: fontHeading,
}

const quoteDateStyle = {
  color: '#888',
  fontSize: '13px',
  margin: '0',
  fontFamily: fontBody,
}

const customerInfoStyle = {
  color: '#555250',
  fontSize: '13px',
  margin: '0 0 4px',
  fontFamily: fontBody,
}

const welcomeSection = {
  padding: '28px 24px 0',
}

const h2 = {
  color: '#555250',
  fontSize: '22px',
  fontWeight: '600',
  margin: '28px 0 14px',
  fontFamily: fontHeading,
}

const h3 = {
  color: '#555250',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 10px',
  fontFamily: fontHeading,
}

const section = {
  padding: '0 24px',
  marginBottom: '20px',
}

const detailColumn = {
  width: '50%',
  paddingRight: '16px',
}

const text = {
  color: '#555250',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 14px',
  fontFamily: fontBody,
}

const detailText = {
  color: '#555250',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 6px',
  fontFamily: fontBody,
}

const servicesTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  marginTop: '12px',
  border: '1px solid #e8e0d8',
  borderRadius: '8px',
}

const tableHeader = {
  backgroundColor: '#f3ece5',
}

const tableHeaderCell = {
  padding: '10px 12px',
  borderBottom: '2px solid #e8e0d8',
  borderRight: '1px solid #e8e0d8',
  fontSize: '12px',
  fontWeight: '700',
  color: '#555250',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  fontFamily: fontBody,
}

const tableRow = {
  borderBottom: '1px solid #e8e0d8',
}

const tableCell = {
  padding: '10px 12px',
  borderRight: '1px solid #e8e0d8',
  fontSize: '13px',
  color: '#555250',
  fontFamily: fontBody,
}

const totalRow = {
  backgroundColor: '#a68bea',
  color: '#ffffff',
}

const totalCell = {
  padding: '14px 12px',
  borderRight: '1px solid rgba(255,255,255,0.3)',
  fontSize: '15px',
  fontWeight: 'bold',
  color: '#ffffff',
  fontFamily: fontHeading,
}

const contactSection = {
  padding: '20px 24px',
  backgroundColor: '#faf7f4',
  borderRadius: '8px',
  margin: '24px 24px',
}

const contactText = {
  color: '#555250',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 6px',
  fontFamily: fontBody,
}

const termsSection = {
  padding: '16px 24px',
  backgroundColor: '#faf7f4',
  borderRadius: '8px',
  margin: '24px 24px',
}

const termsText = {
  color: '#555250',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '0 0 8px',
  paddingLeft: '4px',
  fontFamily: fontBody,
}

const footer = {
  padding: '28px 24px',
  textAlign: 'center' as const,
  backgroundColor: '#f3ece5',
  marginTop: '24px',
}

const footerText = {
  color: '#888',
  fontSize: '11px',
  margin: '6px 0',
  fontFamily: fontBody,
}
