import "./App.css";

import enTranslations from "@shopify/polaris/locales/en.json";
import {
  AppProvider,
  Page,
  Grid,
  Text,
  TextField,
  Card,
  InlineStack,
  Button,
  FooterHelp,
  Link,
  Frame,
  Scrollable,
  BlockStack,
} from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import { useState, useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { ClipboardIcon } from "@shopify/polaris-icons";
import packageJson from "../package.json";
import toast, { Toaster } from "react-hot-toast";
import { Liquid } from "liquidjs";

function App() {
  const [shopifyTemplate, setShopifyTemplate] = useLocalStorage(
    "shopify_template",
    ""
  );

  let defaultShopPayload = {
    name: "My Store",
    email_accent_color: "#1990c6",
    email: "test@example.com",
  };

  let [orderPayload, setOrderPayload] = useLocalStorage("order_payload", "");
  let [shopPayload, setShopPayload] = useLocalStorage(
    "shop_payload",
    JSON.stringify(defaultShopPayload, null, 4)
  );
  let [mechanicTemplate, setMechanicTemplate] = useState();

  // TODO make url relative
  let homepageUrl = packageJson.homepage;
  fetch("/pre-email.liquid")
    .then((r) => r.text())
    .then((text) => {
      mechanicTemplate = text + shopifyTemplate;
      mechanicTemplate = mechanicTemplate.replace(
        /line \| img_url/g,
        "line.image | img_url"
      );
      mechanicTemplate = mechanicTemplate.replace(
        /{{\s*'notifications\/discounttag\.png'\s*\|\s*shopify_asset_url\s*}}/g,
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAMAAADW3miqAAAAA3NCSVQICAjb4U/gAAAAKlBMVEVHcExzc3N0dHR0dHR0dHR7e3t0dHR7e3t0dHR0dHR0dHR0dHR0dHRzc3MVUs63AAAADXRSTlMAjICayhd2DfJHYiy6LL19dgAAAMlJREFUOI2N1FEShSAIBVAzIdTY/3Zf6ViCaO9+2hkBdXJuzBFTzIfxoUvcSjDmKcm4vUkRDAJpU/FxaKas74H4CZ1JVvLVsAx1vbVmtGHen0qtmdEwybFNw6zGNg33lYQhBEBqCLxlGO8S2JC5D3M5amjINhOkejbLDecsGs+L2d8jSF/mRvBlqN7J0nAo13KuUX12tDS+voHwh3H+D7Pa6jUOZqozUyXMRClzvc9RDcZQhhmUaZSaGKGmplMLc6nz21zBQEH/kn7VIiJnf/Ih6AAAAABJRU5ErkJggg=="
      );

      /* 
      If we don't end up getting the payment_icon_png_url filter impelmented in Mechanic, we can use this instead 
      mechanicTemplate = mechanicTemplate.replace(
        "transaction.payment_details.credit_card_company | payment_icon_png_url",
        "transaction.payment_details.payment_method_image"
      );
      */

      setMechanicTemplate(mechanicTemplate);
    });

  const handleMarkupForPreview = () => {
    if (!markup) {
      return "";
    }

    markup = markup.replace(
      "/assets/notifications/styles.css",
      homepageUrl + "/email-styles.css"
    );

    // TODO make url relative
    markup = markup.replace(
      "notifications/spacer.png",
      "/mechanic-email-migrator/spacer.png"
    );

    return markup;
  };

  const handleShopifyTemplateChange = useCallback((shopifyTemplate) => {
    setShopifyTemplate(shopifyTemplate);
  }, []);

  const handleOrderPayloadChange = useCallback((orderPayload) => {
    setOrderPayload(orderPayload);
  }, []);

  const handleShopPayloadChange = useCallback((shopPayload) => {
    setShopPayload(shopPayload);
  }, []);

  const handleCopyButton = () => {
    navigator.clipboard.writeText(mechanicTemplate);
    console.log("Copied to clipboard", mechanicTemplate);
    toast.success("Copied Mechanic template to clipboard", {
      duration: 2000,
    });
  };

  let order = "";
  try {
    order = JSON.parse(orderPayload);
  } catch (error) {
    // do nothing
  }
  let shop = "";
  try {
    shop = JSON.parse(shopPayload ? shopPayload : defaultShopPayload);
  } catch (error) {
    // do nothing
  }

  shop.orders = {};
  shop.orders[order.id] = order;

  const data = {
    order_id: order.id,
    shop: shop,
  };

  const engine = new Liquid();
  engine.registerFilter("money", (value) => {
    return "$" + (value / 100).toFixed(2);
  });
  engine.registerFilter("json_parse", (value) => {
    return JSON.parse(value);
  });

  let markup = "";
  if (mechanicTemplate) {
    // markup = engine.parseAndRenderSync(mechanicTemplate, data);
    markup = "test";
  }

  return (
    <AppProvider i18n={enTranslations}>
      <Frame>
        <Toaster />
        <Page
          title="Shopify To Mechanic Email Template Converter"
          primaryAction={{
            content: "Copy",
            icon: ClipboardIcon,
            disabled: shopifyTemplate ? false : true,
            onAction: handleCopyButton,
          }}
          subtitle="Easily convert your Shopify email notification liquid templates to liquid that can be used in Mechanic tasks"
        >
          <BlockStack gap="500">
            <Grid>
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                <Card sectioned>
                  <BlockStack gap="300">
                    <Text as="h2" variant="headingSm">
                      Shopify Template
                    </Text>
                    <TextField
                      maxHeight="400px"
                      value={shopifyTemplate}
                      onChange={handleShopifyTemplateChange}
                      multiline={8}
                      autoComplete="off"
                    />
                  </BlockStack>
                </Card>
              </Grid.Cell>
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                <Card sectioned>
                  <BlockStack gap="300">
                    <InlineStack align="space-between">
                      <Text as="h2" variant="headingSm">
                        Generated Mechanic template
                      </Text>
                    </InlineStack>
                    <TextField
                      maxHeight="400px"
                      disabled
                      value={mechanicTemplate}
                      multiline={8}
                      autoComplete="off"
                    />
                  </BlockStack>
                </Card>
              </Grid.Cell>
            </Grid>

            {/* Disabling the preview for now
            <Grid>
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                <Card sectioned>
                  <BlockStack gap="300">
                    <Text as="h2" variant="headingSm">
                      Order Payload
                    </Text>
                    <TextField
                      maxHeight="150px"
                      value={orderPayload}
                      onChange={handleOrderPayloadChange}
                      multiline={8}
                      autoComplete="off"
                    />
                  </BlockStack>
                </Card>
              </Grid.Cell>
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                <Card>
                  <BlockStack gap="300">
                    <Text as="h2" variant="headingSm">
                      Shop Details
                    </Text>
                    <TextField
                      maxHeight="150px"
                      value={shopPayload}
                      onChange={handleShopPayloadChange}
                      multiline={8}
                      autoComplete="off"
                    />
                  </BlockStack>
                </Card>
              </Grid.Cell>
            </Grid>
            {false && shopifyTemplate ? (
              <Card>
                <iframe
                  id="email-preview"
                  srcDoc={handleMarkupForPreview()}
                  width="100%"
                  height="1300"
                ></iframe>
              </Card>
            ) : (
              ""
            )}
          */}
          </BlockStack>
          <FooterHelp>
            This is an{" "}
            <Link
              monochrome
              url="https://github.com/kalenjordan/mechanic-email-migrator"
            >
              open source project
            </Link>{" "}
            sponsored by{" "}
            <Link monochrome url="https://mechanic.dev/">
              Mechanic
            </Link>
            .
          </FooterHelp>
        </Page>
      </Frame>
    </AppProvider>
  );
}

export default App;
