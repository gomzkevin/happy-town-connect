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
  }>
  totalEstimate: number
  termsConditions?: string
  quoteNumber: string
  createdDate: string
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
        {/* Header */}
        <Section style={header}>
          {logoUrl && (
            <img
              src={logoUrl}
              alt={`${companyName} Logo`}
              style={{
                width: '120px',
                height: 'auto',
                marginBottom: '16px',
                display: 'block',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            />
          )}
          <Heading style={h1}>{companyName}</Heading>
          <Text style={subtitle}>Entretenimiento Infantil Premium</Text>
        </Section>

        {/* Quote Info */}
        <Section style={quoteInfo}>
          <Row>
            <Column style={leftColumn}>
              <Text style={quoteNumber}>Cotización #{quoteNumber}</Text>
              <Text style={quoteDate}>Fecha: {createdDate}</Text>
            </Column>
            <Column style={rightColumn}>
              <Text style={customerInfo}>
                <strong>Para:</strong> {customerName}
              </Text>
              <Text style={customerInfo}>{email}</Text>
              {phone && <Text style={customerInfo}>{phone}</Text>}
            </Column>
          </Row>
        </Section>

        {/* Welcome Message */}
        <Section style={welcomeSection}>
          <Heading style={h2}>¡Hola {customerName}! 🎉</Heading>
          <Text style={text}>
            Gracias por contactar a {companyName}. Hemos preparado una cotización personalizada para tu evento.
          </Text>
        </Section>

        {/* Customer and Event Details */}
        <Section style={section}>
          <Row>
            <Column style={detailColumn}>
              <Heading style={h3}>👤 Datos del Cliente</Heading>
              <Text style={detailText}>
                <strong>Nombre:</strong> {customerName}
              </Text>
              <Text style={detailText}>
                <strong>Email:</strong> {email}
              </Text>
              {phone && (
                <Text style={detailText}>
                  <strong>Teléfono:</strong> {phone}
                </Text>
              )}
            </Column>
            <Column style={detailColumn}>
              <Heading style={h3}>📅 Datos del Evento</Heading>
              {eventDate && (
                <Text style={detailText}>
                  <strong>Fecha:</strong> {eventDate}
                </Text>
              )}
              {childrenCount && (
                <Text style={detailText}>
                  <strong>Niños:</strong> {childrenCount}
                </Text>
              )}
              {location && (
                <Text style={detailText}>
                  <strong>Ubicación:</strong> {location}
                </Text>
              )}
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
                <th style={{...tableHeaderCell, textAlign: 'center'}}>Cantidad</th>
                <th style={{...tableHeaderCell, textAlign: 'right'}}>Precio Unit.</th>
                <th style={{...tableHeaderCell, textAlign: 'right'}}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service, index) => (
                <tr key={index} style={tableRow}>
                  <td style={tableCell}>{service.name}</td>
                  <td style={{...tableCell, textAlign: 'center'}}>{service.quantity}</td>
                  <td style={{...tableCell, textAlign: 'right'}}>${service.price.toLocaleString()}</td>
                  <td style={{...tableCell, textAlign: 'right', fontWeight: 'bold'}}>
                    ${(service.price * service.quantity).toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr style={totalRow}>
                <td style={{...totalCell, borderRight: 'none'}} colSpan={3}>
                  <strong>TOTAL ESTIMADO</strong>
                </td>
                <td style={{...totalCell, textAlign: 'right'}}>
                  <strong>${totalEstimate.toLocaleString()}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* Next Steps */}
        <Section style={section}>
          <Heading style={h2}>📞 Próximos Pasos</Heading>
          <Text style={text}>
            1. <strong>Revisa</strong> los detalles de tu cotización
          </Text>
          <Text style={text}>
            2. <strong>Contáctanos</strong> para confirmar tu reservación
          </Text>
          <Text style={text}>
            3. <strong>¡Disfruta</strong> de una fiesta inolvidable!
          </Text>
          <Text style={{...text, marginTop: '20px'}} className="no-print">
            💡 <em>Tip: Puedes imprimir este email para conservar tu cotización</em>
          </Text>
        </Section>

        {/* Contact Information */}
        <Section style={contactSection} className="print-friendly">
          <Heading style={h2}>📞 Información de Contacto</Heading>
          <Row>
            <Column>
              <Text style={contactText}>
                <strong>Email:</strong> <Link href={`mailto:${companyEmail}`}>{companyEmail}</Link>
              </Text>
              {companyPhone && (
                <Text style={contactText}>
                  <strong>Teléfono:</strong> {companyPhone}
                </Text>
              )}
            </Column>
            <Column>
              {companyAddress && (
                <Text style={contactText}>
                  <strong>Dirección:</strong> {companyAddress}
                </Text>
              )}
            </Column>
          </Row>
        </Section>

        {/* Terms and Conditions */}
        {termsConditions && (
          <Section style={termsSection} className="print-friendly">
            <Heading style={h3}>📋 Términos y Condiciones</Heading>
            <Text style={termsText}>{termsConditions}</Text>
          </Section>
        )}

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            Esta cotización es válida por 30 días desde la fecha de emisión.
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

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '800px',
}

const header = {
  padding: '32px 24px',
  textAlign: 'center' as const,
  backgroundColor: '#a68bea',
  color: '#ffffff',
}

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 8px',
}

const h2 = {
  color: '#333333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '32px 0 16px',
}

const h3 = {
  color: '#333333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px',
}

const subtitle = {
  color: '#ffffff',
  fontSize: '16px',
  margin: '0',
}

const quoteInfo = {
  padding: '20px 24px',
  backgroundColor: '#f8f9fa',
  borderBottom: '3px solid #a68bea',
}

const leftColumn = {
  width: '50%',
}

const rightColumn = {
  width: '50%',
  textAlign: 'right' as const,
}

const quoteNumber = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#a68bea',
  margin: '0 0 4px',
}

const quoteDate = {
  color: '#666666',
  fontSize: '14px',
  margin: '0',
}

const customerInfo = {
  color: '#333333',
  fontSize: '14px',
  margin: '0 0 4px',
}

const welcomeSection = {
  padding: '32px 24px 0',
}

const section = {
  padding: '0 24px',
  marginBottom: '24px',
}

const detailColumn = {
  width: '50%',
  paddingRight: '20px',
}

const text = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
}

const detailText = {
  color: '#333333',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 8px',
}

const servicesTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  marginTop: '16px',
  border: '1px solid #e6e6e6',
}

const tableHeader = {
  backgroundColor: '#f8f9fa',
}

const tableHeaderCell = {
  padding: '12px',
  borderBottom: '2px solid #e6e6e6',
  borderRight: '1px solid #e6e6e6',
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#333333',
}

const tableRow = {
  borderBottom: '1px solid #e6e6e6',
}

const tableCell = {
  padding: '12px',
  borderRight: '1px solid #e6e6e6',
  fontSize: '14px',
  color: '#333333',
}

const totalRow = {
  backgroundColor: '#a68bea',
  color: '#ffffff',
}

const totalCell = {
  padding: '15px 12px',
  borderRight: '1px solid #ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#ffffff',
}

const contactSection = {
  padding: '24px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  margin: '32px 24px',
}

const contactText = {
  color: '#333333',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 8px',
}

const termsSection = {
  padding: '20px 24px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  margin: '32px 24px',
}

const termsText = {
  color: '#666666',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '0',
}

const footer = {
  padding: '32px 24px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e6e6e6',
  marginTop: '32px',
}

const footerText = {
  color: '#666666',
  fontSize: '12px',
  margin: '0 0 8px',
}