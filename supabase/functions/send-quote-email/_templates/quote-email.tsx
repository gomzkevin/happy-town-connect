import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface QuoteEmailProps {
  customerName: string
  companyName: string
  companyEmail: string
  companyPhone?: string
  companyAddress?: string
  services: Array<{
    name: string
    price: number
    quantity: number
  }>
  totalEstimate: number
  eventDate?: string
  childrenCount?: number
  location?: string
  termsConditions?: string
}

export const QuoteEmail = ({
  customerName,
  companyName,
  companyEmail,
  companyPhone,
  companyAddress,
  services,
  totalEstimate,
  eventDate,
  childrenCount,
  location,
  termsConditions,
}: QuoteEmailProps) => (
  <Html>
    <Head />
    <Preview>Tu cotización personalizada de {companyName} está lista 🎉</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>¡Hola {customerName}! 🎉</Heading>
          <Text style={subtitle}>
            Gracias por contactar a {companyName}. Hemos preparado una cotización personalizada para tu evento.
          </Text>
        </Section>

        <Section style={section}>
          <Heading style={h2}>📋 Detalles del Evento</Heading>
          {eventDate && (
            <Text style={text}>
              <strong>Fecha del evento:</strong> {eventDate}
            </Text>
          )}
          {childrenCount && (
            <Text style={text}>
              <strong>Número de niños:</strong> {childrenCount}
            </Text>
          )}
          {location && (
            <Text style={text}>
              <strong>Ubicación:</strong> {location}
            </Text>
          )}
        </Section>

        <Section style={section}>
          <Heading style={h2}>🎪 Servicios Seleccionados</Heading>
          {services.map((service, index) => (
            <Row key={index} style={serviceRow}>
              <Column style={serviceColumn}>
                <Text style={serviceName}>{service.name}</Text>
                <Text style={serviceDetails}>
                  Cantidad: {service.quantity} × ${service.price.toLocaleString()}
                </Text>
              </Column>
              <Column style={priceColumn}>
                <Text style={servicePrice}>
                  ${(service.price * service.quantity).toLocaleString()}
                </Text>
              </Column>
            </Row>
          ))}
          
          <Row style={totalRow}>
            <Column>
              <Text style={totalText}>
                <strong>Total Estimado: ${totalEstimate.toLocaleString()}</strong>
              </Text>
            </Column>
          </Row>
        </Section>

        <Section style={section}>
          <Heading style={h2}>📞 Próximos Pasos</Heading>
          <Text style={text}>
            1. <strong>Revisa</strong> los detalles de tu cotización en el PDF adjunto
          </Text>
          <Text style={text}>
            2. <strong>Contactanos</strong> para confirmar tu reservación
          </Text>
          <Text style={text}>
            3. <strong>¡Disfruta</strong> de una fiesta inolvidable!
          </Text>
        </Section>

        <Section style={contactSection}>
          <Heading style={h2}>📞 Información de Contacto</Heading>
          <Text style={text}>
            <strong>Email:</strong> <Link href={`mailto:${companyEmail}`}>{companyEmail}</Link>
          </Text>
          {companyPhone && (
            <Text style={text}>
              <strong>Teléfono:</strong> {companyPhone}
            </Text>
          )}
          {companyAddress && (
            <Text style={text}>
              <strong>Dirección:</strong> {companyAddress}
            </Text>
          )}
        </Section>

        {termsConditions && (
          <Section style={termsSection}>
            <Text style={termsText}>{termsConditions}</Text>
          </Section>
        )}

        <Section style={footer}>
          <Text style={footerText}>
            Gracias por elegir {companyName} para tu evento especial 🎉
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default QuoteEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const header = {
  padding: '32px 24px',
  textAlign: 'center' as const,
  backgroundColor: '#ff6b6b',
  color: '#ffffff',
}

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 16px',
}

const h2 = {
  color: '#333333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '32px 0 16px',
}

const subtitle = {
  color: '#ffffff',
  fontSize: '16px',
  margin: '0',
}

const section = {
  padding: '0 24px',
}

const text = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
}

const serviceRow = {
  borderBottom: '1px solid #e6e6e6',
  padding: '16px 0',
}

const serviceColumn = {
  width: '70%',
}

const priceColumn = {
  width: '30%',
  textAlign: 'right' as const,
}

const serviceName = {
  color: '#333333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 4px',
}

const serviceDetails = {
  color: '#666666',
  fontSize: '14px',
  margin: '0',
}

const servicePrice = {
  color: '#333333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
}

const totalRow = {
  borderTop: '2px solid #ff6b6b',
  padding: '16px 0',
  marginTop: '16px',
}

const totalText = {
  color: '#333333',
  fontSize: '20px',
  textAlign: 'right' as const,
  margin: '0',
}

const contactSection = {
  padding: '24px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  margin: '32px 24px',
}

const termsSection = {
  padding: '0 24px',
  marginTop: '32px',
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
  color: '#999999',
  fontSize: '14px',
  margin: '0',
}